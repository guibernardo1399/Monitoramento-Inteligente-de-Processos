import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { createSession, hashPassword } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Ja existe uma conta com este e-mail." }, { status: 409 });
    }

    const office = await prisma.office.create({
      data: {
        name: body.officeName,
        slug: `${slugify(body.officeName)}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });

    const user = await prisma.user.create({
      data: {
        officeId: office.id,
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "OWNER",
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar conta." },
      { status: 400 },
    );
  }
}
