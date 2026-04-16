import { NextResponse } from "next/server";
import { alertActionSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardJsonRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await guardJsonRequest(request, {
      schema: alertActionSchema,
      maxBytes: 4 * 1024,
      requireSameOrigin: true,
      rateLimit: {
        bucket: "alerts-update",
        limit: 60,
        windowMs: 10 * 60 * 1000,
      },
    });

    const alert = await prisma.alert.updateMany({
      where: {
        id,
        officeId: user.officeId,
        ...(user.role === "OWNER"
          ? {}
          : {
              process: {
                internalResponsibleId: user.id,
              },
            }),
      },
      data: {
        status: body.status,
      },
    });

    return secureJson(alert);
  } catch (error) {
    return handleRouteError(error, "Erro ao atualizar alerta.");
  }
}
