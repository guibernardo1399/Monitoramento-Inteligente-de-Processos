import { NextResponse } from "next/server";
import { alertActionSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = alertActionSchema.parse(await request.json());

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

    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar alerta." },
      { status: 400 },
    );
  }
}
