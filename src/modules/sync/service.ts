import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import { datajudConnector } from "@/connectors";
import { classifyMovement, humanReviewLabel } from "@/modules/alerts/rules";
import { syncProcessPublications } from "@/modules/publications/sync-service";

export async function syncProcess(
  processId: string,
  officeId: string,
  options?: { publicationMode?: "initial" | "incremental" },
) {
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
  const publicationSync = await syncProcessPublications({
    processId,
    officeId,
    cnjNumber: process.cnjNumber,
    court: process.court,
    judgingBody: process.judgingBody,
    lawyerName: process.lawyerName,
    lawyerOab: process.lawyerOab,
    mode: options?.publicationMode || "incremental",
  });

  if (!snapshot) {
    const syncedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.process.update({
        where: { id: processId },
        data: {
          lastSyncedAt: syncedAt,
          lastEventAt: publicationSync.latestPublicationDate || process.lastEventAt || syncedAt,
        },
      });

      await tx.syncLog.create({
        data: {
          officeId,
          processId,
          source: syncSource,
          startedAt: syncStart,
          finishedAt: syncedAt,
          status: publicationSync.newPublications > 0 ? "PARTIAL" : "FAILED",
          errorMessage:
            publicationSync.newPublications > 0
              ? "Dados processuais indisponiveis no momento, mas publicacoes oficiais foram sincronizadas."
              : "Nenhum dado retornado pelo conector configurado.",
          rawPayload: JSON.stringify({
            snapshot,
            publications: publicationSync.fetchedPublications,
          }),
        },
      });
    });

    return {
      newMovements: 0,
      newPublications: publicationSync.newPublications,
      status: publicationSync.newPublications > 0 ? ("PARTIAL" as const) : ("FAILED" as const),
      syncedAt: publicationSync.newPublications > 0 ? syncedAt.toISOString() : null,
      message:
        publicationSync.newPublications > 0
          ? options?.publicationMode === "initial"
            ? `Carga historica inicial concluida com ${publicationSync.newPublications} publicacao(oes) oficiais recuperadas do DJEN.`
            : `Sincronizacao parcial concluida com ${publicationSync.newPublications} nova(s) publicacao(oes) oficiais do DJEN.`
          : "A sincronizacao foi executada, mas nao encontramos dados atualizados para esse processo.",
    };
  }

  const movementCreates: Prisma.ProcessMovementCreateManyInput[] = [];
  const existingMovements = await prisma.processMovement.findMany({
    where: { processId },
    select: { title: true, movementDate: true },
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

  const latestMovementDate = movementCreates
    .map((item) => new Date(item.movementDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const syncedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.process.update({
      where: { id: processId },
      data: {
        court: snapshot.court,
        className: snapshot.className,
        subject: snapshot.subject,
        judgingBody: snapshot.judgingBody,
        externalReference: snapshot.externalReference,
        lastSyncedAt: syncedAt,
        lastEventAt: publicationSync.latestPublicationDate || latestMovementDate || process.lastEventAt || new Date(),
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

    await tx.syncLog.create({
      data: {
        officeId,
        processId,
        source: syncSource,
        startedAt: syncStart,
        finishedAt: syncedAt,
        status:
          publicationSync.newPublications > 0 || movementCreates.length > 0 ? "SUCCESS" : "PARTIAL",
        rawPayload: JSON.stringify({
          snapshot,
          publications: publicationSync.fetchedPublications,
        }),
        externalReference: snapshot.externalReference,
      },
    });
  });

  return {
    newMovements: movementCreates.length,
    newPublications: publicationSync.newPublications,
    status: publicationSync.newPublications > 0 || movementCreates.length > 0 ? "SUCCESS" : "PARTIAL",
    syncedAt: syncedAt.toISOString(),
    message:
      movementCreates.length > 0 || publicationSync.newPublications > 0
        ? options?.publicationMode === "initial"
          ? `Cadastro concluido com carga historica inicial: ${movementCreates.length} movimentacao(oes) e ${publicationSync.newPublications} publicacao(oes) registradas para este processo.`
          : `Sincronizacao concluida com ${movementCreates.length} nova(s) movimentacao(oes) e ${publicationSync.newPublications} nova(s) publicacao(oes).`
        : "Sincronizacao concluida. Nenhuma nova movimentacao ou publicacao foi encontrada.",
  };
}
