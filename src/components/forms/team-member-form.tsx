"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TeamMemberForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/office-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error || "Não foi possível criar o membro.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Não foi possível criar o membro.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-mist/60 p-4">
      <fieldset className="space-y-4" disabled={pending}>
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
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Criando Membro..." : "Criar Membro"}
      </Button>
    </form>
  );
}
