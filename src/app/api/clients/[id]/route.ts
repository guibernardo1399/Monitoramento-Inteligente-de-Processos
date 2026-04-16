import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";
import { guardRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await guardRequest(_request, {
      requireSameOrigin: true,
      rateLimit: {
        bucket: "clients-delete",
        limit: 20,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await requireUser();
    const { id } = await params;

    if (user.role !== "OWNER") {
      return secureJson(
        { error: "Somente o proprietario pode apagar clientes." },
        { status: 403 },
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        id,
        officeId: user.officeId,
      },
      select: {
        id: true,
        _count: {
          select: {
            processes: true,
          },
        },
      },
    });

    if (!client) {
      return secureJson({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    if (client._count.processes > 0) {
      return secureJson(
        { error: "Este cliente possui processos vinculados e nao pode ser apagado." },
        { status: 400 },
      );
    }

    await prisma.client.delete({
      where: { id: client.id },
    });

    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Erro ao apagar cliente.");
  }
}
