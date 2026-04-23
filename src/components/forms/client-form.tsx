"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ClientForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          document: formData.get("document"),
          notes: formData.get("notes"),
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error || "Não foi possível cadastrar o cliente.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Não foi possível cadastrar o cliente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-mist/70 p-4">
      <fieldset className="space-y-4" disabled={pending}>
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
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Cadastrando cliente..." : "Adicionar cliente"}
      </Button>
    </form>
  );
}
