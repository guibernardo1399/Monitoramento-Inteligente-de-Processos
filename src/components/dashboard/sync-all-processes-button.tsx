"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncAllProcessesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSyncAll() {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/processes/sync-all", {
        method: "POST",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error || "Não foi possível sincronizar os processos.");
        return;
      }

      setSuccess(body?.message || "Sincronização concluída.");
      router.refresh();
    } catch {
      setError("Não foi possível sincronizar os processos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleSyncAll} disabled={loading}>
        <span className="inline-flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando Processos..." : "Sincronizar Todos os Processos"}
        </span>
      </Button>
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
