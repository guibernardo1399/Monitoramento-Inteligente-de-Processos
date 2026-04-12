import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { createSession, verifyPassword } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao autenticar." },
      { status: 400 },
    );
  }
}
