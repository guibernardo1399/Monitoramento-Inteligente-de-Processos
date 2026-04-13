import type { ExternalPublication } from "@/connectors/types";
import type { AlertSeverity } from "@/modules/alerts/rules";
import { buildPublicationSummary } from "@/modules/processes/summaries";

function loweredText(publication: ExternalPublication) {
  return [
    publication.actType || "",
    publication.title,
    publication.excerpt || "",
    publication.content,
  ]
    .join(" ")
    .toLowerCase();
}

export function classifyPublicationSeverity(publication: ExternalPublication): AlertSeverity {
  const text = loweredText(publication);

  if (
    publication.hasDeadlineHint ||
    ["intim", "prazo", "manifest", "contest", "embargo", "contrarrazo", "recurso"].some((term) =>
      text.includes(term),
    )
  ) {
    return "CRITICAL";
  }

  if (["despacho", "decis", "sentenca", "acordao", "certidao", "edital"].some((term) => text.includes(term))) {
    return "ATTENTION";
  }

  return "INFO";
}

export function buildPublicationAlertMessage(publication: ExternalPublication, severity: AlertSeverity) {
  if (severity === "CRITICAL") {
    return `${buildPublicationSummary(publication)} Revisão humana obrigatória.`;
  }

  if (severity === "ATTENTION") {
    return `${buildPublicationSummary(publication)} Revisão humana recomendada.`;
  }

  return buildPublicationSummary(publication);
}
