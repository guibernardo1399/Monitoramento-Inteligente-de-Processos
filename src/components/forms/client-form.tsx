"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error || "Nao foi possivel cadastrar o cliente.");
        return;
      }

      event.currentTarget.reset();
      setSuccess("Cliente cadastrado com sucesso.");
      window.location.href = `/clients?atualizado=${Date.now()}`;
      return;
    } catch (error) {
      setError("Nao foi possivel cadastrar o cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-mist/70 p-4">
      <fieldset disabled={loading} className="space-y-4">
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
      </fieldset>
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Cadastrando cliente..." : "Adicionar cliente"}
      </Button>
    </form>
  );
}
