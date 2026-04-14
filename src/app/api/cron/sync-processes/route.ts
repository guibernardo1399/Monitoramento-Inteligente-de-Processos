import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import { syncOfficeProcesses } from "@/jobs/monitor-processes";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const headerToken = request.headers.get("x-cron-secret");

  return Boolean(
    env.cronSecret &&
      (bearerToken === env.cronSecret || headerToken === env.cronSecret),
  );
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
    }

    const offices = await prisma.office.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const summary = {
      officesProcessed: offices.length,
      totalProcesses: 0,
      updatedProcesses: 0,
      partialProcesses: 0,
      failedProcesses: 0,
    };

    for (const office of offices) {
      const result = await syncOfficeProcesses({
        officeId: office.id,
        isOwner: true,
      });

      summary.totalProcesses += result.total;
      summary.updatedProcesses += result.updatedProcesses;
      summary.partialProcesses += result.partialProcesses;
      summary.failedProcesses += result.failedProcesses;
    }

    return NextResponse.json({
      ok: true,
      ...summary,
      message: `Sincronização automática concluída. Escritórios: ${summary.officesProcessed}. Processos consultados: ${summary.totalProcesses}. Com novidades: ${summary.updatedProcesses}. Parciais: ${summary.partialProcesses}. Com erro: ${summary.failedProcesses}.`,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel executar a sincronizacao automatica.",
      },
      { status: 500 },
    );
  }
}
