"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TeamMemberForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/office-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel criar o membro.");
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-mist/60 p-4">
      <fieldset disabled={loading} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Nome do membro</label>
          <Input name="name" placeholder="Ex.: Juliana Alves" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">E-mail</label>
          <Input name="email" type="email" placeholder="juliana@escritorio.com" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Senha inicial</label>
          <Input name="password" type="password" placeholder="Minimo de 6 caracteres" required />
        </div>
      </fieldset>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Criando membro..." : "Criar membro"}
      </Button>
    </form>
  );
}
