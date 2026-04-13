import type { AlertSeverity } from "@/modules/alerts/rules";
import type { ExternalPublication } from "@/connectors/types";
import { buildPublicationAlertMessage, classifyPublicationSeverity } from "@/modules/publications/rules";

export function buildPublicationAlertData(input: {
  officeId: string;
  processId: string;
  publication: ExternalPublication;
}) {
  const severity = classifyPublicationSeverity(input.publication);

  return {
    officeId: input.officeId,
    processId: input.processId,
    title: `Nova publicacao oficial: ${input.publication.title}`,
    message: buildPublicationAlertMessage(input.publication, severity),
    severity,
    requiresHumanReview: severity !== "INFO",
  };
}

export function buildMovementAlertData(input: {
  officeId: string;
  processId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
}) {
  return {
    officeId: input.officeId,
    processId: input.processId,
    title: input.title,
    message: input.message,
    severity: input.severity,
    requiresHumanReview: input.severity !== "INFO",
  };
}
