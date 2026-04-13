"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { TeamMemberActionState } from "@/app/(dashboard)/team/actions";
import { createTeamMemberAction } from "@/app/(dashboard)/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: TeamMemberActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? "Criando Membro..." : "Criar Membro"}
    </Button>
  );
}

export function TeamMemberForm() {
  const [state, formAction] = useActionState(createTeamMemberAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-mist/60 p-4">
      <fieldset className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Nome do Membro</label>
          <Input name="name" placeholder="Ex.: Juliana Alves" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">E-mail</label>
          <Input name="email" type="email" placeholder="juliana@escritorio.com" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Senha Inicial</label>
          <Input name="password" type="password" placeholder="Minimo de 6 caracteres" required />
        </div>
      </fieldset>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
