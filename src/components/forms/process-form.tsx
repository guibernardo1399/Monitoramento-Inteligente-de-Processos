"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cnjRemainingDigits, formatCNJ } from "@/lib/utils";

export function ProcessForm({
  clients,
  responsibles,
}: {
  clients: Array<{ id: string; name: string }>;
  responsibles: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cnjValue, setCnjValue] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/processes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Nao foi possivel cadastrar o processo.");
      setLoading(false);
      return;
    }

    const body = await response.json();
    router.push(`/processes/${body.id}`);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-ink">Numero CNJ</label>
          <Input
            name="cnjNumber"
            placeholder="5001682-64.2024.8.26.0100"
            required
            disabled={loading}
            value={cnjValue}
            onChange={(event) => setCnjValue(formatCNJ(event.target.value))}
            inputMode="numeric"
          />
          <p className="text-xs text-steel">
            O sistema tenta consultar dados oficiais; sem conector ativo, usa mock realista para modo demo.
          </p>
          <p className="text-xs text-steel">
            {cnjRemainingDigits(cnjValue) === 0
              ? "Numero CNJ completo."
              : `Faltam ${cnjRemainingDigits(cnjValue)} digito(s) para completar o CNJ.`}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Cliente</label>
          <Select name="clientId" required defaultValue="" disabled={loading}>
            <option value="" disabled>
              Selecione
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Responsavel interno</label>
          <Select name="internalResponsibleId" defaultValue="" disabled={loading}>
            <option value="">Nao definido</option>
            {responsibles.map((responsible) => (
              <option key={responsible.id} value={responsible.id}>
                {responsible.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Advogado monitorado</label>
          <Input name="lawyerName" placeholder="Ex.: Mariana Rocha" disabled={loading} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">Numero da OAB</label>
          <Input name="lawyerOab" placeholder="Ex.: OAB/SP 123456" disabled={loading} />
          <p className="text-xs text-steel">
            Use a OAB para organizar busca, carteira de processos e futuras integracoes por advogado.
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-ink">Observacoes internas</label>
          <Textarea
            name="notes"
            placeholder="Ex.: cliente sensivel a atualizacoes, priorizar revisao no mesmo dia."
            disabled={loading}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar processo"}
        </Button>
      </div>
    </form>
  );
}
