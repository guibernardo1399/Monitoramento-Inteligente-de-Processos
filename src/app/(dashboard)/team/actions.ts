"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { officeMemberSchema } from "@/lib/validators";
import { prisma } from "@/server/db/prisma";
import { hashPassword, requireUser } from "@/server/auth/session";

export type TeamMemberActionState = {
  error?: string;
};

export async function createTeamMemberAction(
  _previousState: TeamMemberActionState,
  formData: FormData,
): Promise<TeamMemberActionState> {
  try {
    const user = await requireUser();

    if (user.role !== "OWNER") {
      return { error: "Apenas o proprietario pode criar membros." };
    }

    const body = officeMemberSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const email = body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Ja existe uma conta com este e-mail." };
    }

    await prisma.user.create({
      data: {
        officeId: user.officeId,
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "MEMBER",
      },
    });

    revalidatePath("/team");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível criar o membro.",
    };
  }

  redirect(`/team?atualizado=${Date.now()}`);
}
