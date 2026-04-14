import { env } from "@/lib/env";
import type { ExternalPublication, PublicationConnector, PublicationSearchFilters } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";
import { fetchJson } from "@/connectors/utils/http";
import { normalizeCnjNumber } from "@/connectors/utils/tribunal-alias";
import { normalizeExternalDateInput } from "@/lib/utils";

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

type DjenQueryVariant = {
  name: string;
  params: Record<string, string>;
};

function isForbiddenDjenSource(urlValue: string) {
  const forbiddenHostToken = ["comunica", "api"].join("");
  return new RegExp(forbiddenHostToken, "i").test(urlValue);
}

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
    publicationDate:
      normalizeExternalDateInput(item.dataPublicacao || item.dataDisponibilizacao) ||
      new Date().toISOString(),
    availabilityDate: normalizeExternalDateInput(item.dataDisponibilizacao) || undefined,
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
  supportsLiveData = Boolean(
    env.djenBaseUrl &&
      env.djenApiPath &&
      !isForbiddenDjenSource(env.djenBaseUrl) &&
      !isForbiddenDjenSource(env.djenApiPath),
  );

  async fetchPublications(filters: PublicationSearchFilters) {
    if (env.useMockConnectors) {
      return mockProcessSnapshots[filters.cnjNumber]?.publications ?? [];
    }

    if (isForbiddenDjenSource(env.djenBaseUrl) || isForbiddenDjenSource(env.djenApiPath)) {
      console.error("[ERRO] Tentativa de acesso a fonte não permitida", {
        source: "DJEN",
        baseUrl: env.djenBaseUrl,
        path: env.djenApiPath,
      });
      throw new Error("Fonte DJEN configurada em domínio não permitido.");
    }

    if (!this.supportsLiveData) {
      throw new Error("Fonte DJEN não configurada corretamente.");
    }

    const normalizedCnj = normalizeCnjNumber(filters.cnjNumber);
    const variants: DjenQueryVariant[] = [
      {
        name: "numero-processo-tribunal-periodo",
        params: {
          numeroProcesso: normalizedCnj,
          pagina: "1",
          itensPorPagina: "50",
          ...(filters.court ? { siglaTribunal: filters.court.replace(/\s+/g, "").toUpperCase() } : {}),
          ...(filters.availabilityDateFrom
            ? { dataDisponibilizacaoInicio: filters.availabilityDateFrom }
            : {}),
          ...(filters.availabilityDateTo ? { dataDisponibilizacaoFim: filters.availabilityDateTo } : {}),
        },
      },
      {
        name: "numero-processo-periodo",
        params: {
          numeroProcesso: normalizedCnj,
          pagina: "1",
          itensPorPagina: "50",
          ...(filters.availabilityDateFrom
            ? { dataDisponibilizacaoInicio: filters.availabilityDateFrom }
            : {}),
          ...(filters.availabilityDateTo ? { dataDisponibilizacaoFim: filters.availabilityDateTo } : {}),
        },
      },
      {
        name: "numero-processo-puro",
        params: {
          numeroProcesso: normalizedCnj,
          pagina: "1",
          itensPorPagina: "50",
        },
      },
    ];

    let lastError: Error | null = null;

    for (const variant of variants) {
      try {
        console.log("[SYNC] Fonte permitida: DataJud/DJEN", {
          source: "DJEN",
          variant: variant.name,
        });
        console.log("[DJEN] Iniciando consulta pública", {
          variant: variant.name,
          cnjNumber: filters.cnjNumber,
          court: filters.court || null,
        });

        const url = new URL(env.djenApiPath, env.djenBaseUrl);

        Object.entries(variant.params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });

        const response = await fetchJson<DjenApiResponse>(url.toString(), {
          method: "GET",
          timeoutMs: env.djenTimeoutMs,
          headers: {
            Accept: "application/json",
            "User-Agent": "Monitoramento-Inteligente-Processos/1.0",
          },
        });

        const items = response.items || response.content || response.data || [];
        console.log("[DJEN] Consulta pública concluída com sucesso", {
          variant: variant.name,
          cnjNumber: filters.cnjNumber,
          items: items.length,
        });
        return items.map((item) => normalizePublication(item, filters));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Falha ao consultar o DJEN.");
        console.error("[DJEN] Falha na consulta pública", {
          variant: variant.name,
          cnjNumber: filters.cnjNumber,
          message: lastError.message,
        });

        if (lastError.message.includes("HTTP 403")) {
          continue;
        }

        throw lastError;
      }
    }

    if (lastError?.message.includes("HTTP 403")) {
      throw new Error(
        "O DJEN bloqueou a consulta publica para este processo no momento (HTTP 403). O processo pode ser cadastrado, mas as publicacoes oficiais podem precisar de uma nova tentativa depois.",
      );
    }

    throw lastError || new Error("Nao foi possivel consultar o DJEN no momento.");
  }
}
