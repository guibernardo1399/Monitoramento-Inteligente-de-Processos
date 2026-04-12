import { NextResponse } from "next/server";
import { clientSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = clientSchema.parse(await request.json());

    const client = await prisma.client.create({
      data: {
        officeId: user.officeId,
        name: body.name,
        document: body.document || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao cadastrar cliente." },
      { status: 400 },
    );
  }
}
