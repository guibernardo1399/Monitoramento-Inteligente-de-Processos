import { createHash } from "node:crypto";
import { subDays } from "date-fns";
import { env } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import { djenConnector } from "@/connectors";
import type { ExternalPublication } from "@/connectors/types";
import { createPublicationAlert } from "@/modules/alerts/service";

function publicationFingerprint(publication: ExternalPublication) {
  return createHash("sha256")
    .update(
      [
        publication.cnjNumber,
        publication.externalReference || "",
        publication.publicationDate,
        publication.availabilityDate || "",
        publication.actType || "",
        publication.court || "",
        publication.judgingBody || "",
        publication.title,
        publication.excerpt || "",
      ].join("|"),
    )
    .digest("hex");
}

export async function syncProcessPublications(input: {
  processId: string;
  officeId: string;
  cnjNumber: string;
  court?: string | null;
  judgingBody?: string | null;
  lawyerName?: string | null;
  lawyerOab?: string | null;
  mode?: "initial" | "incremental";
}) {
  const lookbackDays =
    input.mode === "initial" ? env.djenInitialLookbackDays : env.djenIncrementalLookbackDays;

  const publications = await djenConnector.fetchPublications({
    cnjNumber: input.cnjNumber,
    court: input.court,
    judgingBody: input.judgingBody,
    lawyerName: input.lawyerName,
    lawyerOab: input.lawyerOab,
    availabilityDateFrom: subDays(new Date(), lookbackDays).toISOString().slice(0, 10),
  });

  const normalized = publications.map((publication) => ({
    ...publication,
    externalReference: publication.externalReference || undefined,
    fingerprintHash: publicationFingerprint(publication),
  }));

  const latestPublicationDate =
    normalized
      .map((publication) => new Date(publication.publicationDate))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  if (normalized.length === 0) {
    return {
      fetchedPublications: [],
      newPublications: 0,
      latestPublicationDate: null,
      mode: input.mode || "incremental",
    };
  }

  const existing = await prisma.processPublication.findMany({
    where: {
      processId: input.processId,
      OR: [
        {
          externalReference: {
            in: normalized
              .map((publication) => publication.externalReference)
              .filter((value): value is string => Boolean(value)),
          },
        },
        {
          fingerprintHash: {
            in: normalized.map((publication) => publication.fingerprintHash),
          },
        },
      ],
    },
    select: {
      externalReference: true,
      fingerprintHash: true,
    },
  });

  const existingReferences = new Set(
    existing.map((item) => item.externalReference).filter((value): value is string => Boolean(value)),
  );
  const existingFingerprints = new Set(
    existing.map((item) => item.fingerprintHash).filter((value): value is string => Boolean(value)),
  );

  const freshPublications = normalized.filter((publication) => {
    if (publication.externalReference && existingReferences.has(publication.externalReference)) return false;
    return !existingFingerprints.has(publication.fingerprintHash);
  });

  if (freshPublications.length === 0) {
    return {
      fetchedPublications: normalized,
      newPublications: 0,
      latestPublicationDate,
      mode: input.mode || "incremental",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.processPublication.createMany({
      data: freshPublications.map((publication) => ({
        processId: input.processId,
        externalId: publication.externalId,
        externalReference: publication.externalReference || null,
        fingerprintHash: publication.fingerprintHash,
        cnjNumber: publication.cnjNumber,
        publicationDate: new Date(publication.publicationDate),
        availabilityDate: publication.availabilityDate ? new Date(publication.availabilityDate) : null,
        actType: publication.actType || null,
        source: publication.source,
        court: publication.court || null,
        judgingBody: publication.judgingBody || null,
        title: publication.title,
        excerpt: publication.excerpt || null,
        content: publication.content,
        hasDeadlineHint: Boolean(publication.hasDeadlineHint),
        rawPayload: publication.rawPayload ? JSON.stringify(publication.rawPayload) : null,
      })),
    });

    for (const publication of freshPublications) {
      await createPublicationAlert(tx, {
        officeId: input.officeId,
        processId: input.processId,
        publication,
      });
    }
  });

  return {
    fetchedPublications: normalized,
    newPublications: freshPublications.length,
    latestPublicationDate,
    mode: input.mode || "incremental",
  };
}
