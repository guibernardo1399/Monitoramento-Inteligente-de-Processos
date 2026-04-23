import { loginSchema } from "@/lib/validators";
import { createSession, verifyPassword } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
    console.log("[AUTH] Iniciando login");
    const body = await guardJsonRequest(request, {
      schema: loginSchema,
      maxBytes: 4 * 1024,
      requireSameOrigin: true,
      rateLimit: {
        bucket: "auth-login",
        limit: 10,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      console.warn("[AUTH] Login sem usuário", { email: body.email.toLowerCase() });
      return secureJson({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);
    if (!validPassword) {
      console.warn("[AUTH] Login com senha inválida", { email: body.email.toLowerCase() });
      return secureJson({ error: "Credenciais invalidas." }, { status: 401 });
    }

    await createSession(user.id);
    console.log("[AUTH] Login concluído com sucesso", { userId: user.id });

    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao autenticar.");
  }
}
