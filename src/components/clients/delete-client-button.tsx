"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({
  clientId,
  disabled,
}: {
  clientId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente apagar este cliente? Esta ação não poderá ser desfeita.",
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error || "Não foi possível apagar o cliente.");
        return;
      }

      router.refresh();
    } catch {
      setError("Não foi possível apagar o cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="ghost" onClick={handleDelete} disabled={loading || disabled}>
        {loading ? "Apagando..." : "Apagar Cliente"}
      </Button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
