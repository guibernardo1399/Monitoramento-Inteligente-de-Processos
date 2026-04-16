import { NextResponse } from "next/server";
import { clearSession } from "@/server/auth/session";
import { guardRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
    await guardRequest(request, {
      requireSameOrigin: true,
      rateLimit: {
        bucket: "auth-logout",
        limit: 30,
        windowMs: 10 * 60 * 1000,
      },
    });

    await clearSession();
    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao encerrar a sessao.");
  }
}
