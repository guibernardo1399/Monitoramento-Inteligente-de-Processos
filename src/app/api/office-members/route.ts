import { NextResponse } from "next/server";
import { officeMemberSchema } from "@/lib/validators";
import { hashPassword, requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Apenas o proprietario pode criar membros." }, { status: 403 });
    }

    const body = officeMemberSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Ja existe uma conta com este e-mail." }, { status: 409 });
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

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar membro." },
      { status: 400 },
    );
  }
}
