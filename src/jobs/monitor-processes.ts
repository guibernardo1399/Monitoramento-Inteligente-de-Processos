import { prisma } from "@/server/db/prisma";
import { syncProcess } from "@/modules/sync/service";

export async function runMonitoringJob(officeId: string) {
  const processes = await prisma.process.findMany({
    where: {
      officeId,
      monitoringStatus: "ACTIVE",
    },
    select: { id: true },
  });

  const results = [];
  for (const process of processes) {
    results.push(await syncProcess(process.id, officeId));
  }

  return results;
}

export async function syncOfficeProcesses(input: {
  officeId: string;
  userId?: string;
  isOwner?: boolean;
}) {
  const processes = await prisma.process.findMany({
    where: {
      officeId: input.officeId,
      monitoringStatus: { in: ["ACTIVE", "PARTIAL"] },
      ...(input.isOwner ? {} : { internalResponsibleId: input.userId }),
    },
    select: {
      id: true,
      cnjNumber: true,
    },
    orderBy: [{ lastSyncedAt: "asc" }, { updatedAt: "asc" }],
  });

  const results = [];

  for (const process of processes) {
    try {
      const result = await syncProcess(process.id, input.officeId);
      results.push({
        processId: process.id,
        cnjNumber: process.cnjNumber,
        ok: true,
        status: result.status,
        newMovements: result.newMovements,
        newPublications: result.newPublications,
      });
    } catch (error) {
      results.push({
        processId: process.id,
        cnjNumber: process.cnjNumber,
        ok: false,
        status: "FAILED" as const,
        newMovements: 0,
        newPublications: 0,
        error: error instanceof Error ? error.message : "Falha ao sincronizar este processo.",
      });
    }
  }

  const updatedProcesses = results.filter(
    (item) => item.ok && (item.newMovements > 0 || item.newPublications > 0),
  ).length;
  const partialProcesses = results.filter((item) => item.status === "PARTIAL").length;
  const failedProcesses = results.filter((item) => !item.ok).length;

  return {
    total: results.length,
    updatedProcesses,
    partialProcesses,
    failedProcesses,
    results,
  };
}
