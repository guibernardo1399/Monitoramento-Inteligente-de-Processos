import type { ExternalMovement, ExternalPublication } from "@/connectors/types";
import { classifyPublicationSeverity } from "@/modules/publications/rules";

export type AlertSeverity = "INFO" | "ATTENTION" | "CRITICAL";

export function classifyMovement(_movement: ExternalMovement): AlertSeverity {
  return "INFO";
}

export function classifyPublication(publication: ExternalPublication): AlertSeverity {
  return classifyPublicationSeverity(publication);
}

export function humanReviewLabel(severity: AlertSeverity) {
  if (severity === "CRITICAL") return "Revisão humana imediata recomendada";
  if (severity === "ATTENTION") return "Revisão humana recomendada";
  return "Verifique a atualização no processo";
}
