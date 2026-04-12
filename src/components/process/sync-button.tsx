"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SyncButton({ processId }: { processId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/processes/${processId}/sync`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Sincronizando..." : "Sincronizar agora"}
    </Button>
  );
}
