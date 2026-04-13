import { notFound } from "next/navigation";
import { AlertActions } from "@/components/process/alert-actions";
import { DeleteProcessButton } from "@/components/process/delete-process-button";
import { ReportButton } from "@/components/process/report-button";
import { SyncButton } from "@/components/process/sync-button";
import { ProcessTimeline } from "@/components/process/timeline";
import { AlertStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getProcessDetails } from "@/modules/processes/queries";
import { requireUser } from "@/server/auth/session";

export default async function ProcessDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ aviso?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const process = await getProcessDetails(id, user.officeId, user.id, user.role === "OWNER");

  if (!process) notFound();

  const timeline = [
    ...process.movements.map((movement) => ({
      id: movement.id,
      date: movement.movementDate,
      title: movement.title,
      description: movement.description,
      type: "movement" as const,
    })),
    ...process.publications.map((publication) => ({
      id: publication.id,
      date: publication.publicationDate,
      title: publication.title,
      description: publication.content,
      type: "publication" as const,
      severity: publication.hasDeadlineHint ? "CRITICAL" : "ATTENTION",
    })),
    ...process.alerts.map((alert) => ({
      id: alert.id,
      date: alert.createdAt,
      title: alert.title,
      description: alert.message,
      type: "alert" as const,
      severity: alert.severity,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
      {resolvedSearchParams?.aviso ? (
        <Card>
          <p className="text-sm leading-6 text-amber-900">{resolvedSearchParams.aviso}</p>
        </Card>
      ) : null}
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-brand">{process.court}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{process.cnjNumber}</h2>
            <p className="mt-2 text-sm leading-6 text-steel">
              {process.className} • {process.subject} • {process.judgingBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-steel">
              <span>Cliente: {process.client.name}</span>
              <span>Advogado: {process.lawyerName || "Nao informado"}</span>
              <span>OAB: {process.lawyerOab || "Nao informada"}</span>
              <span>Responsavel: {process.internalResponsible?.name || "Nao definido"}</span>
              <span>Ultima sincronizacao: {process.lastSyncedAt ? formatDateTime(process.lastSyncedAt) : "Nunca"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ReportButton processId={process.id} />
            <SyncButton processId={process.id} />
            <DeleteProcessButton processId={process.id} />
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-ink">Timeline do processo</h3>
            <p className="mt-2 text-sm text-steel">
              Movimentacoes, publicacoes e alertas organizados em ordem cronologica para a rotina do escritorio.
            </p>
            <div className="mt-5">
              <ProcessTimeline items={timeline} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-ink">Partes envolvidas</h3>
            <div className="mt-4 space-y-3">
              {process.parties.map((party) => (
                <div key={party.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink">{party.name}</span>
                    <span className="text-sm text-steel">{party.role}</span>
                  </div>
                  {party.document ? <p className="mt-2 text-sm text-steel">{party.document}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-ink">Alertas gerados</h3>
            <div className="mt-4 space-y-3">
              {process.alerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                  </div>
                  <h4 className="mt-3 font-semibold text-ink">{alert.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-steel">{alert.message}</p>
                  <p className="mt-2 text-xs text-steel">{formatDateTime(alert.createdAt)}</p>
                  <div className="mt-4">
                    <AlertActions alertId={alert.id} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-ink">Logs de sincronizacao</h3>
            <div className="mt-4 space-y-3">
              {process.syncLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-line p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink">{log.source}</span>
                    <span className="text-steel">{log.status}</span>
                  </div>
                  <p className="mt-2 text-steel">
                    Inicio: {formatDateTime(log.startedAt)} • Fim: {log.finishedAt ? formatDateTime(log.finishedAt) : "em andamento"}
                  </p>
                  {log.errorMessage ? <p className="mt-2 text-rose-600">{log.errorMessage}</p> : null}
                  {log.externalReference ? <p className="mt-2 text-steel">Referencia externa: {log.externalReference}</p> : null}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-ink">Observacoes internas</h3>
            <p className="mt-3 text-sm leading-6 text-steel">{process.notes || "Nenhuma observacao registrada."}</p>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              Alertas com potencial prazo sao apenas sugestoes operacionais. A validacao final deve ser feita por revisao humana.
            </p>
            <p className="mt-4 text-xs text-steel">Criado em {formatDate(process.createdAt)}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
