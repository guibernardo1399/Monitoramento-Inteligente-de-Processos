"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientSchema } from "@/lib/validators";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";

export type ClientActionState = {
  error?: string;
};

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  try {
    const user = await requireUser();

    if (user.role !== "OWNER") {
      return { error: "Somente o proprietario pode cadastrar clientes." };
    }

    const body = clientSchema.parse({
      name: formData.get("name"),
      document: formData.get("document"),
      notes: formData.get("notes"),
    });

    await prisma.client.create({
      data: {
        officeId: user.officeId,
        name: body.name,
        document: body.document || null,
        notes: body.notes || null,
      },
    });

    revalidatePath("/clients");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível cadastrar o cliente.",
    };
  }

  redirect(`/clients?atualizado=${Date.now()}`);
}
