import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { syncProcess } from "@/modules/sync/service";
import { getProcessDetails } from "@/modules/processes/queries";
import { guardRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await guardRequest(_request, {
      requireSameOrigin: true,
      rateLimit: {
        bucket: "processes-sync-one",
        limit: 20,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await requireUser();
    const { id } = await params;
    const process = await getProcessDetails(id, user.officeId, user.id, user.role === "OWNER");

    if (!process) {
      return secureJson({ error: "Processo nao encontrado." }, { status: 404 });
    }

    const result = await syncProcess(id, user.officeId);
    return secureJson(result);
  } catch (error) {
    return handleRouteError(error, "Erro ao sincronizar processo.");
  }
}
