import { registerSchema } from "@/lib/validators";
import { createSession, hashPassword } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    console.log("[AUTH] Iniciando criação de conta");
    const body = await guardJsonRequest(request, {
      schema: registerSchema,
      maxBytes: 6 * 1024,
      requireSameOrigin: true,
      rateLimit: {
        bucket: "auth-register",
        limit: 5,
        windowMs: 10 * 60 * 1000,
      },
    });
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn("[AUTH] Cadastro com e-mail existente", { email });
      return secureJson({ error: "Ja existe uma conta com este e-mail." }, { status: 409 });
    }

    const office = await prisma.office.create({
      data: {
        name: body.officeName,
        slug: `${slugify(body.officeName)}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });

    const user = await prisma.user.create({
      data: {
        officeId: office.id,
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "OWNER",
      },
    });

    await createSession(user.id);
    console.log("[AUTH] Conta criada com sucesso", { userId: user.id, officeId: office.id });
    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao criar conta.");
  }
}
