import type { ExternalMovement, ExternalPublication } from "@/connectors/types";

export type AlertSeverity = "INFO" | "ATTENTION" | "CRITICAL";

export function classifyMovement(_movement: ExternalMovement): AlertSeverity {
  return "INFO";
}

export function classifyPublication(publication: ExternalPublication): AlertSeverity {
  if (publication.hasDeadlineHint) return "CRITICAL";
  return "ATTENTION";
}

export function humanReviewLabel(severity: AlertSeverity) {
  if (severity === "CRITICAL") return "Revisao humana imediata recomendada";
  if (severity === "ATTENTION") return "Revisao humana recomendada";
  return "Acompanhar na rotina do escritorio";
}
