"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ClientActionState } from "@/app/(dashboard)/clients/actions";
import { createClientAction } from "@/app/(dashboard)/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState: ClientActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? "Cadastrando cliente..." : "Adicionar cliente"}
    </Button>
  );
}

export function ClientForm() {
  const [state, formAction] = useActionState(createClientAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-mist/70 p-4">
      <fieldset className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Nome</label>
          <Input name="name" placeholder="Ex.: Inova Tech Ltda." required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Documento</label>
          <Input name="document" placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Observações</label>
          <Textarea name="notes" placeholder="Informações relevantes do relacionamento." />
        </div>
      </fieldset>
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
