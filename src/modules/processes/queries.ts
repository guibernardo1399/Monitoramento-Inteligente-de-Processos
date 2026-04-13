import { subDays } from "date-fns";
import { prisma } from "@/server/db/prisma";

export async function getProcesses(
  officeId: string,
  search?: string,
  filter?: "all" | "recent" | "critical",
  userId?: string,
  isOwner = false,
) {
  const recentDate = subDays(new Date(), 3);

  return prisma.process.findMany({
    where: {
      officeId,
      ...(isOwner
        ? {}
        : {
            internalResponsibleId: userId,
          }),
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
    select: {
      id: true,
      cnjNumber: true,
      lawyerOab: true,
      className: true,
      subject: true,
      monitoringStatus: true,
      lastEventAt: true,
      updatedAt: true,
      client: {
        select: {
          name: true,
        },
      },
      internalResponsible: {
        select: {
          id: true,
          name: true,
        },
      },
      alerts: {
        where: { status: { in: ["UNREAD", "READ"] } },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ lastEventAt: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getProcessDetails(
  processId: string,
  officeId: string,
  userId?: string,
  isOwner = false,
) {
  return prisma.process.findFirst({
    where: {
      id: processId,
      officeId,
      ...(isOwner
        ? {}
        : {
            internalResponsibleId: userId,
          }),
    },
    select: {
      id: true,
      cnjNumber: true,
      lawyerName: true,
      lawyerOab: true,
      court: true,
      className: true,
      subject: true,
      judgingBody: true,
      notes: true,
      createdAt: true,
      lastSyncedAt: true,
      client: {
        select: {
          id: true,
          name: true,
          document: true,
        },
      },
      internalResponsible: {
        select: {
          id: true,
          name: true,
        },
      },
      parties: {
        select: {
          id: true,
          name: true,
          role: true,
          document: true,
        },
      },
      movements: {
        orderBy: { movementDate: "desc" },
        take: 40,
        select: {
          id: true,
          movementDate: true,
          title: true,
          description: true,
          rawPayload: true,
        },
      },
      publications: {
        orderBy: { publicationDate: "desc" },
        take: 30,
        select: {
          id: true,
          publicationDate: true,
          availabilityDate: true,
          title: true,
          actType: true,
          court: true,
          judgingBody: true,
          excerpt: true,
          content: true,
          hasDeadlineHint: true,
          source: true,
          rawPayload: true,
        },
      },
      alerts: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          message: true,
          severity: true,
          status: true,
          createdAt: true,
        },
      },
      syncLogs: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          source: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          externalReference: true,
        },
      },
    },
  });
}

export async function getAlerts(
  officeId: string,
  filter?: "all" | "critical" | "pending-review",
  userId?: string,
  isOwner = false,
) {
  return prisma.alert.findMany({
    where: {
      officeId,
      ...(isOwner
        ? {}
        : {
            process: {
              internalResponsibleId: userId,
            },
          }),
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
          lawyerOab: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    take: 50,
    orderBy: [{ createdAt: "desc" }],
  });
}
