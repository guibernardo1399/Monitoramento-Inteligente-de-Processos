import { NextResponse } from "next/server";
import { officeMemberSchema } from "@/lib/validators";
import { hashPassword, requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "OWNER") {
      return secureJson({ error: "Apenas o proprietario pode criar membros." }, { status: 403 });
    }

    const body = await guardJsonRequest(request, {
      schema: officeMemberSchema,
      maxBytes: 6 * 1024,
      requireSameOrigin: true,
      rateLimit: {
        bucket: "members-create",
        limit: 20,
        windowMs: 10 * 60 * 1000,
      },
    });
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return secureJson({ error: "Ja existe uma conta com este e-mail." }, { status: 409 });
    }

    const member = await prisma.user.create({
      data: {
        officeId: user.officeId,
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "MEMBER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return secureJson(member);
  } catch (error) {
    return handleRouteError(error, "Erro ao criar membro.");
  }
}
