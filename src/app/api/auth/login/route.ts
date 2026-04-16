import { loginSchema } from "@/lib/validators";
import { createSession, verifyPassword } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
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
      return secureJson({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);
    if (!validPassword) {
      return secureJson({ error: "Credenciais invalidas." }, { status: 401 });
    }

    await createSession(user.id);

    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao autenticar.");
  }
}
