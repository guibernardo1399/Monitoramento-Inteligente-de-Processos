import Link from "next/link";
import { Plus, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { monitoringStatusConfig } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { getProcesses } from "@/modules/processes/queries";
import { requireUser } from "@/server/auth/session";

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: "all" | "recent" | "critical" }>;
}) {
  try {
    const user = await requireUser();
    const { q, filter } = await searchParams;
    const activeFilter = filter || "all";
    const isOwner = user.role === "OWNER";
    const processes = await getProcesses(user.officeId, q, activeFilter, user.id, isOwner);

    const title =
      activeFilter === "recent"
        ? "Atualizacoes recentes"
        : activeFilter === "critical"
          ? "Processos com alerta critico"
          : "Processos monitorados";
    const description =
      activeFilter === "recent"
        ? "Lista focada nos processos com eventos ou movimentacoes recentes para revisao rapida."
        : activeFilter === "critical"
          ? "Fila dos processos que concentram alertas criticos pendentes."
          : isOwner
            ? "Busca por CNJ, cliente, classe ou assunto com visao rapida de alertas e ultima atividade."
            : "Busca na sua carteira de processos por CNJ, cliente, classe ou assunto.";

    return (
      <div className="space-y-4">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm text-steel">{description}</p>
            </div>
            <div className="flex gap-3">
              <form className="flex gap-2" action="/processes">
                <input type="hidden" name="filter" value={activeFilter} />
                <input
                  name="q"
                  defaultValue={q}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none"
                  placeholder="Buscar por CNJ, OAB, cliente ou assunto"
                />
                <Button variant="secondary" type="submit">
                  Buscar
                </Button>
              </form>
              <Link href="/processes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo processo
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/processes">
            <Button variant={activeFilter === "all" ? "primary" : "secondary"}>Todos</Button>
          </Link>
          <Link href="/processes?filter=recent">
            <Button variant={activeFilter === "recent" ? "primary" : "secondary"}>Atualizados recentemente</Button>
          </Link>
          <Link href="/processes?filter=critical">
            <Button variant={activeFilter === "critical" ? "primary" : "secondary"}>Com alerta critico</Button>
          </Link>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-left text-sm">
              <thead className="bg-mist/70 text-steel">
                <tr>
                  <th className="px-5 py-3 font-medium">Processo</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Última Atualização</th>
                  <th className="px-5 py-3 font-medium">Última Sincronização</th>
                  <th className="px-5 py-3 font-medium">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-steel">
                      Nenhum processo encontrado para este filtro.
                    </td>
                  </tr>
                ) : (
                  processes.map((process) => {
                    const critical = process.alerts.find((alert) => alert.severity === "CRITICAL");
                    return (
                      <tr key={process.id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <Link href={`/processes/${process.id}`} className="font-semibold text-ink">
                            {process.cnjNumber}
                          </Link>
                          <p className="mt-1 text-steel">{process.className}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                            {process.lawyerOab || "OAB nao informada"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-ink">{process.client.name}</p>
                          <p className="mt-1 text-steel">{process.subject}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                            {monitoringStatusConfig[process.monitoringStatus as keyof typeof monitoringStatusConfig] || process.monitoringStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-steel">
                          {process.lastEventAt ? formatDateTime(process.lastEventAt) : "Sem eventos"}
                        </td>
                        <td className="px-5 py-4 text-steel">
                          {process.lastSyncedAt ? formatDateTime(process.lastSyncedAt) : "Nunca sincronizado"}
                        </td>
                        <td className="px-5 py-4">
                          {critical ? (
                            <div className="flex items-center gap-2">
                              <TriangleAlert className="h-4 w-4 text-rose-600" />
                              <SeverityBadge severity="CRITICAL" />
                            </div>
                          ) : process.alerts[0] ? (
                            <SeverityBadge severity={process.alerts[0].severity} />
                          ) : (
                            <span className="text-steel">Sem alertas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("[PROCESSES] Falha ao carregar processos", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return (
      <Card>
        <h2 className="text-xl font-semibold text-ink">Processos monitorados</h2>
        <p className="mt-4 text-sm text-rose-600">
          Nao foi possivel carregar os processos no momento. Tente novamente em instantes.
        </p>
      </Card>
    );
  }
}
