import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    if (user.role !== "OWNER") {
      return NextResponse.json(
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
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    if (client._count.processes > 0) {
      return NextResponse.json(
        { error: "Este cliente possui processos vinculados e nao pode ser apagado." },
        { status: 400 },
      );
    }

    await prisma.client.delete({
      where: { id: client.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao apagar cliente." },
      { status: 400 },
    );
  }
}
