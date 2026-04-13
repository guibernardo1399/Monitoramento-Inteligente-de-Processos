import { notFound } from "next/navigation";
import { AlertActions } from "@/components/process/alert-actions";
import { DeleteProcessButton } from "@/components/process/delete-process-button";
import { ReportButton } from "@/components/process/report-button";
import { SyncButton } from "@/components/process/sync-button";
import { ProcessTimeline } from "@/components/process/timeline";
import { AlertStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ensureSentence,
  extractPublicSourceUrl,
  formatDate,
  formatDateTime,
  summarizeText,
} from "@/lib/utils";
import { getProcessDetails } from "@/modules/processes/queries";
import { requireUser } from "@/server/auth/session";

function buildVisibleSyncNotice(log?: {
  status: string;
  errorMessage: string | null;
  source: string;
}) {
  if (!log) return null;
  if (log.status === "PARTIAL") {
    return "Sincronização parcial. Parte das informações oficiais ainda não pôde ser consultada. Tente novamente mais tarde.";
  }
  if (log.status === "FAILED") {
    return "Não foi possível concluir a última sincronização. Tente novamente mais tarde.";
  }
  return null;
}

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
  const visibleSyncNotice = buildVisibleSyncNotice(process.syncLogs[0]);

  const timeline = [
    ...process.movements.map((movement) => ({
      id: movement.id,
      date: movement.movementDate,
      title: movement.title,
      description: ensureSentence(movement.description),
      type: "movement" as const,
      sourceUrl: extractPublicSourceUrl(movement.rawPayload),
    })),
    ...process.publications.map((publication) => ({
      id: publication.id,
      date: publication.publicationDate,
      title: publication.title,
      description: [
        publication.availabilityDate
          ? `Disponibilização: ${formatDateTime(publication.availabilityDate)}`
          : null,
        `Publicação: ${formatDateTime(publication.publicationDate)}`,
        publication.actType ? `Tipo: ${publication.actType}` : null,
        summarizeText(publication.excerpt || publication.content, 180),
      ]
        .filter(Boolean)
        .join(" • "),
      type: "publication" as const,
      severity: publication.hasDeadlineHint ? "CRITICAL" : "ATTENTION",
      sourceUrl: extractPublicSourceUrl(publication.rawPayload),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
      {resolvedSearchParams?.aviso ? (
        <Card>
          <p className="text-sm leading-6 text-amber-900">{resolvedSearchParams.aviso}</p>
        </Card>
      ) : null}
      {visibleSyncNotice ? (
        <Card>
          <p className="text-sm leading-6 text-amber-900">{visibleSyncNotice}</p>
        </Card>
      ) : null}
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-brand">{process.court}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{process.cnjNumber}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {process.className} • {process.subject} • {process.judgingBody}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-800">
              <span>Cliente: {process.client.name}</span>
              <span>Advogado: {process.lawyerName || "Não informado"}</span>
              <span>OAB: {process.lawyerOab || "Não informada"}</span>
              <span>Responsável: {process.internalResponsible?.name || "Não definido"}</span>
              <span>Última Sincronização: {process.lastSyncedAt ? formatDateTime(process.lastSyncedAt) : "Nunca"}</span>
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
            <h3 className="text-lg font-semibold text-ink">Timeline do Processo</h3>
            <p className="mt-2 text-sm text-slate-700">
              Movimentações e publicações organizadas em ordem cronológica para a rotina do escritório.
            </p>
            <div className="mt-5">
              <ProcessTimeline items={timeline} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-ink">Partes Envolvidas</h3>
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

          <Card id="publicacoes-oficiais">
            <h3 className="text-lg font-semibold text-ink">Publicações Oficiais</h3>
            <p className="mt-2 text-sm text-slate-700">
              Histórico das publicações localizadas para este processo, com data de disponibilização, data de publicação e resumo do conteúdo.
            </p>
            <div className="mt-4 space-y-3">
              {process.publications.length === 0 ? (
                <div className="rounded-2xl border border-line p-4 text-sm text-slate-700">
                  Nenhuma publicação oficial encontrada até o momento.
                </div>
              ) : (
                process.publications.map((publication) => (
                  <div
                    key={publication.id}
                    id={`publicacao-${publication.id}`}
                    className="rounded-2xl border border-line p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="font-semibold text-ink">{publication.title}</h4>
                        <p className="mt-2 text-sm text-slate-700">
                          {publication.actType ? `Tipo do Ato: ${publication.actType} • ` : ""}
                          Publicado em {formatDateTime(publication.publicationDate)}
                          {publication.availabilityDate
                            ? ` • Disponibilizado em ${formatDateTime(publication.availabilityDate)}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                          {publication.source}
                          {publication.court ? ` • ${publication.court}` : ""}
                          {publication.judgingBody ? ` • ${publication.judgingBody}` : ""}
                        </p>
                      </div>
                      <SeverityBadge severity={publication.hasDeadlineHint ? "CRITICAL" : "ATTENTION"} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {publication.excerpt || publication.content}
                    </p>
                    {extractPublicSourceUrl(publication.rawPayload) ? (
                      <div className="mt-3">
                        <a
                          href={extractPublicSourceUrl(publication.rawPayload) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand ring-1 ring-line transition hover:bg-slate-50"
                        >
                          Abrir Documento Oficial
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-ink">Alertas Gerados</h3>
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
            <h3 className="text-lg font-semibold text-ink">Observações Internas</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">{process.notes || "Nenhuma observação registrada."}</p>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              Alertas com potencial prazo são apenas sugestões operacionais. A validação final deve ser feita por revisão humana.
            </p>
            <p className="mt-4 text-xs text-slate-700">Criado em {formatDate(process.createdAt)}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
