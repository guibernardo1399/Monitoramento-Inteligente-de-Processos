import { subDays } from "date-fns";
import { prisma } from "@/server/db/prisma";

export async function getDashboardData(officeId: string) {
  const now = new Date();
  const recentDate = subDays(now, 3);

  const [
    totalProcesses,
    recentProcesses,
    criticalAlerts,
    recentPublications,
    pendingReview,
    recentAlerts,
  ] = await Promise.all([
    prisma.process.count({ where: { officeId } }),
    prisma.process.count({
      where: {
        officeId,
        lastEventAt: { gte: recentDate },
      },
    }),
    prisma.alert.count({
      where: {
        officeId,
        severity: "CRITICAL",
        status: { in: ["UNREAD", "READ"] },
      },
    }),
    prisma.processPublication.findMany({
      where: {
        process: { officeId },
      },
      take: 5,
      orderBy: { publicationDate: "desc" },
      include: { process: true },
    }),
    prisma.alert.count({
      where: {
        officeId,
        requiresHumanReview: true,
        status: { in: ["UNREAD", "READ"] },
      },
    }),
    prisma.alert.findMany({
      where: { officeId },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        process: {
          include: { client: true },
        },
      },
    }),
  ]);

  return {
    totalProcesses,
    recentProcesses,
    criticalAlerts,
    pendingReview,
    recentPublications,
    recentAlerts,
  };
}
