"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel cadastrar o cliente.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-mist/70 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">Nome</label>
        <Input name="name" placeholder="Ex.: Inova Tech Ltda." required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">Documento</label>
        <Input name="document" placeholder="Opcional" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">Observacoes</label>
        <Textarea name="notes" placeholder="Informacoes relevantes do relacionamento." />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Salvando..." : "Adicionar cliente"}
      </Button>
    </form>
  );
}
