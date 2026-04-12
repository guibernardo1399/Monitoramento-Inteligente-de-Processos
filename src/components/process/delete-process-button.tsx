"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteProcessButton({ processId }: { processId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza de que deseja apagar este processo? Essa acao remove historico, alertas e vinculacoes relacionadas.",
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/processes/${processId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel apagar o processo.");
      setLoading(false);
      return;
    }

    router.push("/processes");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>
        {loading ? "Apagando processo..." : "Apagar processo"}
      </Button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
