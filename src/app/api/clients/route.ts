import { NextResponse } from "next/server";
import { clientSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await guardJsonRequest(request, {
      schema: clientSchema,
      maxBytes: 8 * 1024,
      requireSameOrigin: true,
      rateLimit: {
        bucket: "clients-create",
        limit: 30,
        windowMs: 10 * 60 * 1000,
      },
    });

    const client = await prisma.client.create({
      data: {
        officeId: user.officeId,
        name: body.name,
        document: body.document || null,
        notes: body.notes || null,
      },
    });

    return secureJson(client);
  } catch (error) {
    return handleRouteError(error, "Erro ao cadastrar cliente.");
  }
}
