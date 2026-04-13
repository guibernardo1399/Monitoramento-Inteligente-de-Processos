"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SyncButton({ processId }: { processId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSuccess(null);
    setError(null);
    setLoading(true);

    const response = await fetch(`/api/processes/${processId}/sync`, { method: "POST" });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setError(body?.error || "Nao foi possivel sincronizar o processo.");
      setLoading(false);
      return;
    }

    const syncedAtLabel = body?.syncedAt
      ? new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "America/Sao_Paulo",
        }).format(new Date(body.syncedAt))
      : null;

    const baseMessage =
      body?.status === "PARTIAL"
        ? "Sincronização parcial. Tente novamente mais tarde para completar as publicações."
        : body?.message || "Sincronização concluída.";

    setSuccess(
      syncedAtLabel
        ? `${baseMessage} Última sincronização: ${syncedAtLabel}.`
        : baseMessage,
    );
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Sincronizando..." : "Sincronizar Agora"}
      </Button>
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
