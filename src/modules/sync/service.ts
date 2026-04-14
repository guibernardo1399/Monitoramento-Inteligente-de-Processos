import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import { datajudConnector } from "@/connectors";
import { classifyMovement, humanReviewLabel } from "@/modules/alerts/rules";
import { buildMovementAlertData } from "@/modules/alerts/service";
import { buildMovementSummary } from "@/modules/processes/summaries";
import { syncProcessPublications } from "@/modules/publications/sync-service";
import { ensureSentence, summarizeText } from "@/lib/utils";

function summarizeSyncWarning(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("djen bloqueou")) {
    return "Publicações Oficiais Ainda Não Disponíveis. Tente Nova Sincronização Mais Tarde.";
  }

  if (normalized.includes("carga inicial")) {
    return "Carga Inicial Parcial. Tente Nova Sincronização Mais Tarde.";
  }

  if (normalized.includes("sincronizacao concluida parcialmente")) {
    return "Sincronização Parcial. Tente Novamente Mais Tarde.";
  }

  return summarizeText(message, 140);
}

function isPartialExternalIssue(message?: string | null) {
  if (!message) return false;

  const normalized = message.toLowerCase();

  return (
    normalized.includes("http 403") ||
    normalized.includes("bloqueou a consulta publica") ||
    normalized.includes("excedeu o tempo limite") ||
    normalized.includes("timeout") ||
    normalized.includes("tente novamente mais tarde")
  );
}

function buildMovementAlertMessage(input: {
  title: string;
  description: string;
  severity: ReturnType<typeof classifyMovement>;
}) {
  const summary = buildMovementSummary(input.title, input.description);
  return `${ensureSentence(summarizeText(summary, 160))} ${humanReviewLabel(input.severity)}.`;
}

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
  let snapshot = null;
  let snapshotError: string | null = null;

  try {
    snapshot = await datajudConnector.fetchProcessByCNJ(process.cnjNumber);
  } catch (error) {
    snapshotError = error instanceof Error ? error.message : "Falha ao consultar os dados processuais.";
  }

  let publicationSync = {
    fetchedPublications: [] as unknown[],
    newPublications: 0,
    latestPublicationDate: null as Date | null,
    mode: options?.publicationMode || "incremental",
  };
  let publicationError: string | null = null;

  try {
    publicationSync = await syncProcessPublications({
      processId,
      officeId,
      cnjNumber: process.cnjNumber,
      court: process.court,
      judgingBody: process.judgingBody,
      lawyerName: process.lawyerName,
      lawyerOab: process.lawyerOab,
      mode: options?.publicationMode || "incremental",
    });
  } catch (error) {
    publicationError = error instanceof Error ? error.message : "Falha ao consultar publicacoes oficiais.";
  }

  if (!snapshot) {
    const syncedAt = new Date();
    const hasPartialPublicationData = publicationSync.newPublications > 0 || Boolean(publicationSync.latestPublicationDate);
    const partialIssue = hasPartialPublicationData || isPartialExternalIssue(publicationError);
    const status = partialIssue ? "PARTIAL" : "FAILED";
    const errorMessage = [snapshotError, publicationError]
      .filter(Boolean)
      .join(" | ") || "Nenhum dado retornado pelo conector configurado.";

    await prisma.$transaction([
      prisma.process.update({
        where: { id: processId },
        data: {
          lastSyncedAt: syncedAt,
          lastEventAt: publicationSync.latestPublicationDate || process.lastEventAt || syncedAt,
          monitoringStatus: partialIssue ? "PARTIAL" : "ERROR",
        },
      }),
      prisma.syncLog.create({
        data: {
          officeId,
          processId,
          source: syncSource,
          startedAt: syncStart,
          finishedAt: syncedAt,
          status,
          errorMessage,
          rawPayload: JSON.stringify({
            snapshot,
            publications: publicationSync.fetchedPublications,
          }),
        },
      }),
    ]);

    return {
      newMovements: 0,
      newPublications: publicationSync.newPublications,
      status: status as "PARTIAL" | "FAILED",
      syncedAt: syncedAt.toISOString(),
      message:
        partialIssue
          ? options?.publicationMode === "initial"
            ? summarizeSyncWarning(
                `O processo foi cadastrado, mas a carga inicial ficou parcial. Publicacoes recuperadas: ${publicationSync.newPublications}. ${errorMessage}`,
              )
            : summarizeSyncWarning(
                `Sincronizacao parcial concluida com ${publicationSync.newPublications} nova(s) publicacao(oes) oficiais do DJEN. ${errorMessage}`,
              )
          : summarizeSyncWarning(`Nao foi possivel concluir a sincronizacao deste processo. ${errorMessage}`),
    };
  }

  const movementCreates: Prisma.ProcessMovementCreateManyInput[] = [];
  const existingMovements = await prisma.processMovement.findMany({
    where: { processId },
    select: { title: true, movementDate: true },
  });
  const existingMovementKeys = new Set(
    existingMovements.map((item) => `${item.title}::${item.movementDate.getTime()}`),
  );

  for (const movement of snapshot.movements) {
    const movementDate = new Date(movement.date);
    const movementKey = `${movement.title}::${movementDate.getTime()}`;
    const alreadyExists = existingMovementKeys.has(movementKey);

    if (!alreadyExists) {
      existingMovementKeys.add(movementKey);
      movementCreates.push({
        processId,
        externalId: movement.externalId,
        movementDate,
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

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.process.update({
      where: { id: processId },
      data: {
        court: snapshot.court,
        className: snapshot.className,
        subject: snapshot.subject,
        judgingBody: snapshot.judgingBody,
        externalReference: snapshot.externalReference,
        lastSyncedAt: syncedAt,
        lastEventAt: publicationSync.latestPublicationDate || latestMovementDate || process.lastEventAt || new Date(),
        monitoringStatus: publicationError ? (isPartialExternalIssue(publicationError) ? "PARTIAL" : "ERROR") : "ACTIVE",
      },
    }),
  ];

  if (movementCreates.length > 0) {
    operations.push(
      prisma.processMovement.createMany({
        data: movementCreates,
      }),
      prisma.alert.createMany({
        data: movementCreates.map((movement) => {
          const severity = classifyMovement({
            date: new Date(movement.movementDate).toISOString(),
            title: movement.title,
            description: movement.description,
            code: movement.code ?? undefined,
          });

          return buildMovementAlertData({
            officeId,
            processId,
            title: `Nova Movimentação: ${movement.title}`,
            message: buildMovementAlertMessage({
              title: movement.title,
              description: movement.description,
              severity,
            }),
            severity,
          });
        }),
      }),
    );
  }

  operations.push(
    prisma.syncLog.create({
      data: {
        officeId,
        processId,
        source: syncSource,
        startedAt: syncStart,
        finishedAt: syncedAt,
        status:
          snapshotError || publicationError
            ? isPartialExternalIssue(snapshotError) || isPartialExternalIssue(publicationError)
              ? "PARTIAL"
              : "FAILED"
            : "SUCCESS",
        errorMessage: [snapshotError, publicationError].filter(Boolean).join(" | ") || null,
        rawPayload: JSON.stringify({
          snapshot,
          publications: publicationSync.fetchedPublications,
        }),
        externalReference: snapshot.externalReference,
      },
    }),
  );

  await prisma.$transaction(operations);

  return {
    newMovements: movementCreates.length,
    newPublications: publicationSync.newPublications,
    status: snapshotError || publicationError
      ? isPartialExternalIssue(snapshotError) || isPartialExternalIssue(publicationError)
        ? ("PARTIAL" as const)
        : ("FAILED" as const)
      : ("SUCCESS" as const),
    syncedAt: syncedAt.toISOString(),
    message:
      snapshotError || publicationError
        ? options?.publicationMode === "initial"
          ? summarizeSyncWarning(
              `O processo foi cadastrado e os dados principais entraram, mas parte da carga inicial nao foi concluida. ${[snapshotError, publicationError].filter(Boolean).join(" | ")}`,
            )
          : summarizeSyncWarning(
              `Sincronizacao concluida parcialmente. ${[snapshotError, publicationError].filter(Boolean).join(" | ")}`,
            )
        : movementCreates.length > 0 || publicationSync.newPublications > 0
        ? options?.publicationMode === "initial"
          ? `Cadastro concluido com carga historica inicial: ${movementCreates.length} movimentacao(oes) e ${publicationSync.newPublications} publicacao(oes) registradas para este processo.`
          : `Sincronizacao concluida com ${movementCreates.length} nova(s) movimentacao(oes) e ${publicationSync.newPublications} nova(s) publicacao(oes).`
        : "Sincronizacao concluida. Nenhuma nova movimentacao ou publicacao foi encontrada.",
  };
}
