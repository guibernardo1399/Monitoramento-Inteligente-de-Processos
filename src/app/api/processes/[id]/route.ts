import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
      return NextResponse.json({ error: "Processo nao encontrado." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.syncLog.deleteMany({ where: { processId: process.id } }),
      prisma.process.delete({ where: { id: process.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel apagar o processo." },
      { status: 400 },
    );
  }
}
