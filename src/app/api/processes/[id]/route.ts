import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { guardRequest, handleRouteError, secureJson } from "@/server/security/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await guardRequest(_request, {
      requireSameOrigin: true,
      rateLimit: {
        bucket: "processes-delete",
        limit: 20,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await requireUser();
    const { id } = await params;

    const process = await prisma.process.findFirst({
      where: {
        id,
        officeId: user.officeId,
        ...(user.role === "OWNER" ? {} : { internalResponsibleId: user.id }),
      },
      select: { id: true },
    });

    if (!process) {
      return secureJson({ error: "Processo nao encontrado." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.syncLog.deleteMany({ where: { processId: process.id } }),
      prisma.process.delete({ where: { id: process.id } }),
    ]);

    return secureJson({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Nao foi possivel apagar o processo.");
  }
}
