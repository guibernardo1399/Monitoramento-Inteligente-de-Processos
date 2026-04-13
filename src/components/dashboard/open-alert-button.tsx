"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OpenAlertButton({
  alertId,
  processId,
}: {
  alertId: string;
  processId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);

    await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READ" }),
    }).catch(() => null);

    router.push(`/processes/${processId}`);
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={handleOpen} disabled={loading}>
      {loading ? "Abrindo..." : "Abrir Processo"}
    </Button>
  );
}
