import { subDays } from "date-fns";
import { prisma } from "@/server/db/prisma";

export async function getDashboardData(officeId: string, userId?: string, isOwner = false) {
  const now = new Date();
  const recentDate = subDays(now, 3);
  const queueDate = subDays(now, 7);
  const processScope = isOwner
    ? { officeId }
    : {
        officeId,
        internalResponsibleId: userId,
      };
  const alertScope = isOwner
    ? { officeId }
    : {
        officeId,
        process: {
          internalResponsibleId: userId,
        },
      };

  const [
    totalProcesses,
    recentProcesses,
    criticalAlerts,
    recentPublications,
    pendingReview,
    recentAlerts,
  ] = await Promise.all([
    prisma.process.count({ where: processScope }),
    prisma.process.count({
      where: {
        ...processScope,
        lastEventAt: { gte: recentDate },
      },
    }),
    prisma.alert.count({
      where: {
        ...alertScope,
        severity: "CRITICAL",
        status: { in: ["UNREAD", "READ"] },
      },
    }),
    prisma.processPublication.findMany({
      where: {
        process: processScope,
      },
      take: 5,
      orderBy: { publicationDate: "desc" },
      select: {
        id: true,
        publicationDate: true,
        availabilityDate: true,
        title: true,
        excerpt: true,
        content: true,
        process: {
          select: {
            id: true,
            cnjNumber: true,
          },
        },
      },
    }),
    prisma.alert.count({
      where: {
        ...alertScope,
        requiresHumanReview: true,
        status: { in: ["UNREAD", "READ"] },
      },
    }),
    prisma.alert.findMany({
      where: {
        ...alertScope,
        status: "UNREAD",
        createdAt: { gte: queueDate },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        severity: true,
        status: true,
        createdAt: true,
        process: {
          select: {
            id: true,
            cnjNumber: true,
            client: {
              select: {
                name: true,
              },
            },
          },
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
