import { NextResponse } from "next/server";
import { syncOfficeProcesses } from "@/jobs/monitor-processes";
import { requireUser } from "@/server/auth/session";
import { guardRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
    await guardRequest(request, {
      requireSameOrigin: true,
      rateLimit: {
        bucket: "processes-sync-all",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await requireUser();
    const result = await syncOfficeProcesses({
      officeId: user.officeId,
      userId: user.id,
      isOwner: user.role === "OWNER",
    });

    return secureJson({
      ...result,
      message:
        result.total === 0
          ? "Nenhum processo ativo disponível para sincronização."
          : `Sincronização concluída em ${result.total} processo(s). Atualizados: ${result.updatedProcesses}. Parciais: ${result.partialProcesses}. Falhas: ${result.failedProcesses}.`,
    });
  } catch (error) {
    return handleRouteError(error, "Não foi possível sincronizar os processos.");
  }
}
