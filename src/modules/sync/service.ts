import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import { datajudConnector, djenConnector } from "@/connectors";
import { classifyMovement, classifyPublication, humanReviewLabel } from "@/modules/alerts/rules";

export async function syncProcess(processId: string, officeId: string) {
  const process = await prisma.process.findFirst({
    where: { id: processId, officeId },
    include: { client: true },
  });

  if (!process) {
    throw new Error("Processo nao encontrado.");
  }

  const syncStart = new Date();
  const syncSource = env.useMockConnectors ? "MOCK" : "DATAJUD";
  const snapshot = await datajudConnector.fetchProcessByCNJ(process.cnjNumber);
  const publications = await djenConnector.fetchPublicationsByCNJ(process.cnjNumber);

  if (!snapshot) {
    await prisma.syncLog.create({
      data: {
        officeId,
        processId,
        source: syncSource,
        startedAt: syncStart,
        finishedAt: new Date(),
        status: "FAILED",
        errorMessage: "Nenhum dado retornado pelo conector configurado.",
      },
    });
    return { newMovements: 0, newPublications: 0 };
  }

  const movementCreates: Prisma.ProcessMovementCreateManyInput[] = [];
  const publicationCreates: Prisma.ProcessPublicationCreateManyInput[] = [];

  const existingMovements = await prisma.processMovement.findMany({
    where: { processId },
    select: { title: true, movementDate: true },
  });

  const existingPublications = await prisma.processPublication.findMany({
    where: { processId },
    select: { title: true, publicationDate: true, source: true },
  });

  for (const movement of snapshot.movements) {
    const alreadyExists = existingMovements.some(
      (item) =>
        item.title === movement.title &&
        item.movementDate.getTime() === new Date(movement.date).getTime(),
    );

    if (!alreadyExists) {
      movementCreates.push({
        processId,
        externalId: movement.externalId,
        movementDate: new Date(movement.date),
        title: movement.title,
        description: movement.description,
        code: movement.code,
        rawPayload: movement.rawPayload ? JSON.stringify(movement.rawPayload) : null,
      });
    }
  }

  for (const publication of publications) {
    const alreadyExists = existingPublications.some(
      (item) =>
        item.title === publication.title &&
        item.source === publication.source &&
        item.publicationDate.getTime() === new Date(publication.date).getTime(),
    );

    if (!alreadyExists) {
      publicationCreates.push({
        processId,
        externalId: publication.externalId,
        publicationDate: new Date(publication.date),
        source: publication.source,
        title: publication.title,
        content: publication.content,
        hasDeadlineHint: Boolean(publication.hasDeadlineHint),
        rawPayload: publication.rawPayload ? JSON.stringify(publication.rawPayload) : null,
      });
    }
  }

  const latestMovementDate = movementCreates
    .map((item) => new Date(item.movementDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestPublicationDate = publicationCreates
    .map((item) => new Date(item.publicationDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  await prisma.$transaction(async (tx) => {
    await tx.process.update({
      where: { id: processId },
      data: {
        court: snapshot.court,
        className: snapshot.className,
        subject: snapshot.subject,
        judgingBody: snapshot.judgingBody,
        externalReference: snapshot.externalReference,
        lastSyncedAt: new Date(),
        lastEventAt: latestPublicationDate || latestMovementDate || process.lastEventAt || new Date(),
      },
    });

    if (movementCreates.length > 0) {
      await tx.processMovement.createMany({
        data: movementCreates,
      });

      for (const movement of movementCreates) {
        const severity = classifyMovement({
          date: new Date(movement.movementDate).toISOString(),
          title: movement.title,
          description: movement.description,
          code: movement.code ?? undefined,
        });

        await tx.alert.create({
          data: {
            officeId,
            processId,
            title: `Nova movimentacao: ${movement.title}`,
            message: `${movement.description}. ${humanReviewLabel(severity)}.`,
            severity,
            requiresHumanReview: severity !== "INFO",
          },
        });
      }
    }

    if (publicationCreates.length > 0) {
      await tx.processPublication.createMany({
        data: publicationCreates,
      });

      for (const publication of publicationCreates) {
        const severity = classifyPublication({
          date: new Date(publication.publicationDate).toISOString(),
          source: publication.source,
          title: publication.title,
          content: publication.content,
          hasDeadlineHint: publication.hasDeadlineHint,
        });

        await tx.alert.create({
          data: {
            officeId,
            processId,
            title: `Nova publicacao: ${publication.title}`,
            message: `${publication.content}. ${humanReviewLabel(severity)}.`,
            severity,
            requiresHumanReview: true,
          },
        });
      }
    }

    await tx.syncLog.create({
      data: {
        officeId,
        processId,
        source: syncSource,
        startedAt: syncStart,
        finishedAt: new Date(),
        status: publicationCreates.length > 0 || movementCreates.length > 0 ? "SUCCESS" : "PARTIAL",
        rawPayload: JSON.stringify({
          snapshot,
          publications,
        }),
        externalReference: snapshot.externalReference,
      },
    });
  });

  return {
    newMovements: movementCreates.length,
    newPublications: publicationCreates.length,
  };
}
