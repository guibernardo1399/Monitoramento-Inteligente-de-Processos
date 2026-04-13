import type { ExternalPublication } from "@/connectors/types";
import type { AlertSeverity } from "@/modules/alerts/rules";

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
  const excerpt = publication.excerpt || publication.content;

  if (severity === "CRITICAL") {
    return `${excerpt} Possivel impacto em prazo ou providencia processual. Revisao humana obrigatoria.`;
  }

  if (severity === "ATTENTION") {
    return `${excerpt} Publicacao oficial identificada para acompanhamento. Revisao humana recomendada.`;
  }

  return `${excerpt} Publicacao oficial registrada para historico e acompanhamento.`;
}
