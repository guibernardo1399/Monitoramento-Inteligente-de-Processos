import { env } from "@/lib/env";
import type { ExternalPublication, PublicationConnector, PublicationSearchFilters } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";
import { fetchJson } from "@/connectors/utils/http";
import { normalizeCnjNumber } from "@/connectors/utils/tribunal-alias";

type DjenApiItem = {
  id?: string | number;
  codigo?: string | number;
  hash?: string;
  numeroComunicacao?: string;
  numeroProcesso?: string;
  dataPublicacao?: string;
  dataDisponibilizacao?: string;
  tipoComunicacao?: string;
  tipoAto?: string;
  titulo?: string;
  texto?: string;
  conteudo?: string;
  resumo?: string;
  trecho?: string;
  siglaTribunal?: string;
  tribunal?: string;
  orgaoJulgador?: string;
  nomeOrgao?: string;
};

type DjenApiResponse = {
  items?: DjenApiItem[];
  content?: DjenApiItem[];
  data?: DjenApiItem[];
};

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractExcerpt(item: DjenApiItem, content: string) {
  const explicitExcerpt = item.resumo || item.trecho;
  if (explicitExcerpt) return compactWhitespace(explicitExcerpt).slice(0, 280);
  return compactWhitespace(content).slice(0, 280);
}

function inferDeadlineHint(input: { actType?: string; title?: string; content: string }) {
  const lowered = `${input.actType || ""} ${input.title || ""} ${input.content}`.toLowerCase();
  return [
    "prazo",
    "intim",
    "manifest",
    "contrarrazo",
    "contest",
    "embargo",
    "cumprir",
    "recurso",
  ].some((keyword) => lowered.includes(keyword));
}

function normalizePublication(item: DjenApiItem, filters: PublicationSearchFilters): ExternalPublication {
  const cnjNumber = item.numeroProcesso || filters.cnjNumber;
  const content = compactWhitespace(item.texto || item.conteudo || "Publicacao oficial consultada no DJEN.");
  const actType = item.tipoComunicacao || item.tipoAto || undefined;
  const title = compactWhitespace(item.titulo || actType || "Publicacao processual");
  const externalReference =
    item.hash ||
    item.numeroComunicacao ||
    item.id?.toString() ||
    item.codigo?.toString() ||
    undefined;

  return {
    externalId: item.id?.toString() || item.codigo?.toString() || undefined,
    externalReference,
    cnjNumber,
    publicationDate: item.dataPublicacao || item.dataDisponibilizacao || new Date().toISOString(),
    availabilityDate: item.dataDisponibilizacao || undefined,
    actType,
    source: "DJEN",
    court: item.siglaTribunal || item.tribunal || filters.court || undefined,
    judgingBody: item.orgaoJulgador || item.nomeOrgao || filters.judgingBody || undefined,
    title,
    excerpt: extractExcerpt(item, content),
    content,
    hasDeadlineHint: inferDeadlineHint({ actType, title, content }),
    rawPayload: item,
  };
}

export class DjenConnector implements PublicationConnector {
  key = "DJEN";
  supportsLiveData = Boolean(env.djenBaseUrl && env.djenApiPath);

  async fetchPublications(filters: PublicationSearchFilters) {
    if (!this.supportsLiveData || env.useMockConnectors) {
      return mockProcessSnapshots[filters.cnjNumber]?.publications ?? [];
    }

    const url = new URL(env.djenApiPath, env.djenBaseUrl);
    url.searchParams.set("numeroProcesso", normalizeCnjNumber(filters.cnjNumber));
    url.searchParams.set("pagina", "1");
    url.searchParams.set("itensPorPagina", "50");

    if (filters.court) url.searchParams.set("siglaTribunal", filters.court.replace(/\s+/g, "").toUpperCase());
    if (filters.judgingBody) url.searchParams.set("orgaoJulgador", filters.judgingBody);
    if (filters.lawyerName) url.searchParams.set("nomeAdvogado", filters.lawyerName);
    if (filters.lawyerOab) url.searchParams.set("numeroOab", filters.lawyerOab);
    if (filters.publicationDateFrom) url.searchParams.set("dataPublicacaoInicio", filters.publicationDateFrom);
    if (filters.publicationDateTo) url.searchParams.set("dataPublicacaoFim", filters.publicationDateTo);
    if (filters.availabilityDateFrom) {
      url.searchParams.set("dataDisponibilizacaoInicio", filters.availabilityDateFrom);
    }
    if (filters.availabilityDateTo) {
      url.searchParams.set("dataDisponibilizacaoFim", filters.availabilityDateTo);
    }

    const response = await fetchJson<DjenApiResponse>(url.toString(), {
      method: "GET",
      timeoutMs: env.djenTimeoutMs,
      headers: {
        Accept: "application/json",
      },
    });

    const items = response.items || response.content || response.data || [];

    return items.map((item) => normalizePublication(item, filters));
  }
}
