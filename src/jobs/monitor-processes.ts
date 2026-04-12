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
