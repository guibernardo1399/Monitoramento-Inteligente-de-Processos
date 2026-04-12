"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cnjRemainingDigits, formatCNJ } from "@/lib/utils";

export function ProcessForm({
  clients,
  responsibles,
  currentUserId,
  isOwner,
}: {
  clients: Array<{ id: string; name: string }>;
  responsibles: Array<{ id: string; name: string }>;
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cnjValue, setCnjValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset disabled={loading} className="grid gap-5 md:grid-cols-2">
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
            O processo sera cadastrado somente depois que o sistema localizar dados validos para esse CNJ.
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
          <Select
            name="internalResponsibleId"
            defaultValue={isOwner ? "" : currentUserId}
            disabled={loading || !isOwner}
          >
            {isOwner ? <option value="">Nao definido</option> : null}
            {responsibles.map((responsible) => (
              <option key={responsible.id} value={responsible.id}>
                {responsible.name}
              </option>
            ))}
          </Select>
          {!isOwner ? (
            <p className="text-xs text-steel">
              Como membro, voce so pode criar processos sob a sua propria responsabilidade.
            </p>
          ) : null}
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
      </fieldset>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Cadastrando processo..." : "Cadastrar processo"}
        </Button>
      </div>
    </form>
  );
}
