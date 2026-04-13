import { env } from "@/lib/env";
import type { ProcessDataConnector } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";
import { fetchJson } from "@/connectors/utils/http";
import { normalizeCnjNumber, resolveDatajudAlias } from "@/connectors/utils/tribunal-alias";
import { humanizeIdentifier } from "@/lib/utils";

const OFFICIAL_PUBLIC_DATAJUD_API_KEY =
  "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

type DatajudHit = {
  _source?: {
    tribunal?: string;
    numeroProcesso?: string;
    classe?: { nome?: string };
    assuntos?: Array<{ nome?: string }>;
    orgaoJulgador?: { nome?: string };
    movimentos?: Array<{
      codigo?: number;
      nome?: string;
      dataHora?: string;
      complementosTabelados?: Array<{ descricao?: string; nome?: string; valor?: string | number }>;
    }>;
  };
};

type DatajudResponse = {
  hits?: {
    hits?: DatajudHit[];
  };
};

function normalizeComplementValue(value?: string | number) {
  if (value === undefined || value === null) return "";
  return humanizeIdentifier(String(value));
}

function normalizeComplementLabel(value?: string) {
  if (!value) return "";
  return humanizeIdentifier(value);
}

function buildMovementDescription(
  movement: NonNullable<NonNullable<DatajudHit["_source"]>["movimentos"]>[number],
) {
  const details =
    movement.complementosTabelados
      ?.map((item) => {
        const label = normalizeComplementLabel(item.descricao || item.nome);
        const value = normalizeComplementValue(item.valor);

        if (label && value && label !== value) return `${label}: ${value}`;
        return label || value;
      })
      .filter(Boolean) || [];

  const uniqueDetails = [...new Set(details)];

  if (uniqueDetails.length > 0) {
    return uniqueDetails.join(" • ");
  }

  if (movement.nome) {
    return `${humanizeIdentifier(movement.nome)} registrada no processo.`;
  }

  return "Movimentação processual registrada pelo tribunal.";
}

export class DatajudConnector implements ProcessDataConnector {
  key = "DATAJUD";
  supportsLiveData = Boolean(
    env.datajudBaseUrl && (env.datajudApiKey || env.datajudUsePublicKeyFallback),
  );

  async fetchProcessByCNJ(cnjNumber: string) {
    if (!this.supportsLiveData || env.useMockConnectors) {
      return mockProcessSnapshots[cnjNumber] ?? null;
    }

    const alias = resolveDatajudAlias(cnjNumber, env.datajudTribunalAlias);
    if (!alias) {
      throw new Error("Nao foi possivel resolver o alias do tribunal para o Datajud.");
    }

    const body = {
      size: 1,
      query: {
        term: {
          numeroProcesso: normalizeCnjNumber(cnjNumber),
        },
      },
      sort: [
        {
          dataHoraUltimaAtualizacao: {
            order: "desc",
          },
        },
      ],
    };

    const apiKey = env.datajudApiKey || OFFICIAL_PUBLIC_DATAJUD_API_KEY;
    const url = `${env.datajudBaseUrl.replace(/\/$/, "")}/${alias}/_search`;
    const response = await fetchJson<DatajudResponse>(url, {
      method: "POST",
      timeoutMs: env.datajudTimeoutMs,
      headers: {
        Authorization: `APIKey ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const source = response.hits?.hits?.[0]?._source;
    if (!source) return null;

    return {
      cnjNumber,
      court: source.tribunal || alias.replace("api_publica_", "").toUpperCase(),
      className: source.classe?.nome || "Classe nao informada",
      subject: source.assuntos?.map((item) => item.nome).filter(Boolean).join(" • ") || "Assunto nao informado",
      judgingBody: source.orgaoJulgador?.nome || "Orgao julgador nao informado",
      externalReference: `${alias}:${source.numeroProcesso || normalizeCnjNumber(cnjNumber)}`,
      parties: [],
      movements:
        source.movimentos?.map((movement) => ({
          externalId: movement.codigo ? String(movement.codigo) : undefined,
          date: movement.dataHora || new Date().toISOString(),
          title: humanizeIdentifier(movement.nome || "Movimentação"),
          description: buildMovementDescription(movement),
          code: movement.codigo ? String(movement.codigo) : undefined,
          rawPayload: movement,
        })) || [],
      publications: [],
    };
  }
}
