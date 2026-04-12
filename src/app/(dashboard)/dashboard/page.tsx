import { AlertTriangle, BellRing, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateTime } from "@/lib/utils";
import { getDashboardData } from "@/modules/dashboard/queries";
import { requireUser } from "@/server/auth/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const isOwner = user.role === "OWNER";
  const data = await getDashboardData(user.officeId, user.id, isOwner);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Processos monitorados"
          value={data.totalProcesses}
          hint="Base ativa do escritorio."
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          href="/processes"
        />
        <StatCard
          label="Atualizados recentemente"
          value={data.recentProcesses}
          hint="Eventos em ate 72 horas."
          icon={<RefreshCw className="h-5 w-5" />}
          href="/processes?filter=recent"
        />
        <StatCard
          label="Alertas criticos"
          value={data.criticalAlerts}
          hint="Pedem revisao prioritaria."
          icon={<AlertTriangle className="h-5 w-5" />}
          href="/alerts?filter=critical"
        />
        <StatCard
          label="Pendentes de revisao"
          value={data.pendingReview}
          hint="Apoio para a rotina diaria."
          icon={<BellRing className="h-5 w-5" />}
          href="/alerts?filter=pending-review"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-lg font-semibold text-ink">Fila inteligente de alertas</h3>
            <p className="mt-1 text-sm text-steel">Priorize o que precisa de revisao humana primeiro.</p>
          </div>
          <div className="divide-y divide-line">
            {data.recentAlerts.length === 0 ? (
              <div className="px-5 py-8 text-sm text-steel">Nenhum alerta disponivel.</div>
            ) : (
              data.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-sm font-semibold text-ink">{alert.title}</span>
                    </div>
                    <p className="mt-2 text-sm text-steel">{alert.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {alert.process.cnjNumber} • {alert.process.client.name}
                    </p>
                  </div>
                  <span className="text-xs text-steel">{formatDateTime(alert.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-ink">Publicacoes recentes</h3>
            <div className="mt-4 space-y-3">
              {data.recentPublications.map((publication) => (
                <div key={publication.id} className="rounded-2xl border border-line bg-mist/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{publication.title}</span>
                    <span className="text-xs text-steel">{formatDateTime(publication.publicationDate)}</span>
                  </div>
                  <p className="mt-2 text-sm text-steel">{publication.process.cnjNumber}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-brand text-white">
            <h3 className="text-lg font-semibold">Politica do MVP</h3>
            <p className="mt-3 text-sm leading-6 text-white/75">
              O sistema destaca eventos com potencial de prazo, mas nao substitui a analise do advogado. A revisao humana permanece obrigatoria no fluxo.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
