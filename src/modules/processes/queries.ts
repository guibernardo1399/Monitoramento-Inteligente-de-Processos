import { subDays } from "date-fns";
import { prisma } from "@/server/db/prisma";

export async function getProcesses(
  officeId: string,
  search?: string,
  filter?: "all" | "recent" | "critical",
) {
  const recentDate = subDays(new Date(), 3);

  return prisma.process.findMany({
    where: {
      officeId,
      ...(filter === "recent"
        ? {
            lastEventAt: { gte: recentDate },
          }
        : {}),
      ...(filter === "critical"
        ? {
            alerts: {
              some: {
                severity: "CRITICAL",
                status: { in: ["UNREAD", "READ"] },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { cnjNumber: { contains: search } },
              { lawyerOab: { contains: search } },
              { lawyerName: { contains: search } },
              { client: { name: { contains: search } } },
              { className: { contains: search } },
              { subject: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      client: true,
      internalResponsible: true,
      alerts: {
        where: { status: { in: ["UNREAD", "READ"] } },
      },
    },
    orderBy: [{ lastEventAt: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getProcessDetails(processId: string, officeId: string) {
  return prisma.process.findFirst({
    where: {
      id: processId,
      officeId,
    },
    include: {
      client: true,
      internalResponsible: true,
      parties: true,
      movements: {
        orderBy: { movementDate: "desc" },
      },
      publications: {
        orderBy: { publicationDate: "desc" },
      },
      alerts: {
        orderBy: { createdAt: "desc" },
      },
      syncLogs: {
        orderBy: { startedAt: "desc" },
      },
    },
  });
}

export async function getAlerts(
  officeId: string,
  filter?: "all" | "critical" | "pending-review",
) {
  return prisma.alert.findMany({
    where: {
      officeId,
      ...(filter === "critical"
        ? {
            severity: "CRITICAL",
            status: { in: ["UNREAD", "READ"] },
          }
        : {}),
      ...(filter === "pending-review"
        ? {
            requiresHumanReview: true,
            status: { in: ["UNREAD", "READ"] },
          }
        : {}),
    },
    include: {
      process: {
        include: {
          client: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}
