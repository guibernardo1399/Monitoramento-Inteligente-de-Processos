import { NextResponse } from "next/server";
import { syncOfficeProcesses } from "@/jobs/monitor-processes";
import { requireUser } from "@/server/auth/session";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncOfficeProcesses({
      officeId: user.officeId,
      userId: user.id,
      isOwner: user.role === "OWNER",
    });

    return NextResponse.json({
      ...result,
      message:
        result.total === 0
          ? "Nenhum processo ativo disponível para sincronização."
          : `Sincronização concluída em ${result.total} processo(s). Atualizados: ${result.updatedProcesses}. Parciais: ${result.partialProcesses}. Falhas: ${result.failedProcesses}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível sincronizar os processos.",
      },
      { status: 400 },
    );
  }
}
