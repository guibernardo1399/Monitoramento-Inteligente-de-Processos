"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps =
  | {
      mode: "login";
    }
  | {
      mode: "register";
    };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel concluir a autenticacao.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-panel backdrop-blur"
    >
      <fieldset disabled={loading} className="space-y-4 disabled:opacity-100">
        {mode === "register" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Nome do escritorio</label>
            <Input name="officeName" placeholder="Ex.: Rocha & Associados" required disabled={loading} />
          </div>
        ) : null}
        {mode === "register" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Seu nome</label>
            <Input name="name" placeholder="Ex.: Mariana Rocha" required disabled={loading} />
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">E-mail</label>
          <Input name="email" type="email" placeholder="voce@escritorio.com" required disabled={loading} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Senha</label>
          <Input
            name="password"
            type="password"
            placeholder="Minimo de 6 caracteres"
            required
            disabled={loading}
          />
        </div>
      </fieldset>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" fullWidth disabled={loading}>
        {loading
          ? mode === "login"
            ? "Entrando..."
            : "Criando escritorio..."
          : mode === "login"
            ? "Entrar no painel"
            : "Criar conta e escritorio"}
      </Button>
    </form>
  );
}
