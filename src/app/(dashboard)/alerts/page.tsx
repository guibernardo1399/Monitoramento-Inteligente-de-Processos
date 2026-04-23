import Link from "next/link";
import { AlertActions } from "@/components/process/alert-actions";
import { AlertStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getAlerts } from "@/modules/processes/queries";
import { requireUser } from "@/server/auth/session";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "all" | "critical" | "pending-review" }>;
}) {
  try {
    const user = await requireUser();
    const { filter } = await searchParams;
    const activeFilter = filter || "all";
    const isOwner = user.role === "OWNER";
    const alerts = await getAlerts(user.officeId, activeFilter, user.id, isOwner);

    const title =
      activeFilter === "critical"
        ? "Alertas criticos"
        : activeFilter === "pending-review"
          ? "Pendentes de revisao"
          : "Central de alertas";
    const description =
      activeFilter === "critical"
        ? "Veja rapidamente os eventos mais sensiveis que pedem prioridade operacional."
        : activeFilter === "pending-review"
          ? "Fila de itens que ainda dependem de analise humana do escritorio."
          : isOwner
            ? "Historico consolidado de alertas gerados pelo monitoramento."
            : "Historico consolidado dos alertas ligados aos seus processos.";

    return (
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 text-sm text-steel">{description}</p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/alerts">
            <Button variant={activeFilter === "all" ? "primary" : "secondary"}>Todos</Button>
          </Link>
          <Link href="/alerts?filter=critical">
            <Button variant={activeFilter === "critical" ? "primary" : "secondary"}>Criticos</Button>
          </Link>
          <Link href="/alerts?filter=pending-review">
            <Button variant={activeFilter === "pending-review" ? "primary" : "secondary"}>Pendentes de revisao</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <Card>
              <p className="text-sm text-steel">Nenhum alerta encontrado para esse filtro.</p>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <AlertStatusBadge status={alert.status} />
                      <span className="text-sm font-semibold text-ink">{alert.title}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-steel">{alert.message}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                      <span>{alert.process.cnjNumber}</span>
                      <span>{alert.process.client.name}</span>
                      <span>{alert.process.lawyerOab || "OAB nao informada"}</span>
                    </div>
                    <div className="mt-4">
                      <AlertActions alertId={alert.id} />
                    </div>
                  </div>
                  <div className="space-y-3 xl:text-right">
                    <p className="text-xs text-steel">{formatDateTime(alert.createdAt)}</p>
                    <Link href={`/processes/${alert.process.id}`}>
                      <Button variant="secondary">Abrir processo</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("[ALERTS] Falha ao carregar alertas", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return (
      <Card>
        <h2 className="text-xl font-semibold text-ink">Central de alertas</h2>
        <p className="mt-4 text-sm text-rose-600">
          Nao foi possivel carregar os alertas no momento. Tente novamente em instantes.
        </p>
      </Card>
    );
  }
}
