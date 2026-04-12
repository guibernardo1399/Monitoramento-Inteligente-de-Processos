"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AlertActions({ alertId }: { alertId: string }) {
  const router = useRouter();

  async function update(status: "READ" | "REVIEWED" | "NO_IMPACT") {
    await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => update("READ")}>
        Marcar como lido
      </Button>
      <Button variant="secondary" onClick={() => update("REVIEWED")}>
        Marcar como revisado
      </Button>
      <Button variant="ghost" onClick={() => update("NO_IMPACT")}>
        Sem impacto
      </Button>
    </div>
  );
}
