import type { Prisma } from "@prisma/client";
import type { ExternalPublication } from "@/connectors/types";
import { buildPublicationAlertMessage, classifyPublicationSeverity } from "@/modules/publications/rules";

export async function createPublicationAlert(
  tx: Prisma.TransactionClient,
  input: {
    officeId: string;
    processId: string;
    publication: ExternalPublication;
  },
) {
  const severity = classifyPublicationSeverity(input.publication);

  await tx.alert.create({
    data: {
      officeId: input.officeId,
      processId: input.processId,
      title: `Nova publicacao oficial: ${input.publication.title}`,
      message: buildPublicationAlertMessage(input.publication, severity),
      severity,
      requiresHumanReview: severity !== "INFO",
    },
  });

  return severity;
}
