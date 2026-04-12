import { env } from "@/lib/env";
import type { PublicationConnector } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";
import { fetchJson } from "@/connectors/utils/http";

type DjenItem = {
  id?: string | number;
  dataDisponibilizacao?: string;
  dataPublicacao?: string;
  titulo?: string;
  texto?: string;
  conteudo?: string;
  numeroProcesso?: string;
  tipoComunicacao?: string;
};

type DjenResponse = {
  items?: DjenItem[];
  content?: DjenItem[];
};

export class DjenConnector implements PublicationConnector {
  key = "DJEN";
  supportsLiveData = Boolean(env.djenBaseUrl);

  async fetchPublicationsByCNJ(cnjNumber: string) {
    if (!this.supportsLiveData || env.useMockConnectors) {
      return mockProcessSnapshots[cnjNumber]?.publications ?? [];
    }

    if (!env.djenApiPath) {
      throw new Error("DJEN_API_PATH nao configurado para a integracao real.");
    }

    const url = new URL(env.djenApiPath, env.djenBaseUrl);
    url.searchParams.set("numeroProcesso", cnjNumber);

    const response = await fetchJson<DjenResponse>(url.toString(), {
      method: "GET",
      timeoutMs: env.djenTimeoutMs,
      headers: env.djenApiKey
        ? {
            Authorization: `Bearer ${env.djenApiKey}`,
          }
        : undefined,
    });

    const items = response.items || response.content || [];

    return items.map((item) => {
      const content = item.texto || item.conteudo || "Publicacao processual consultada no DJEN.";
      const lowered = content.toLowerCase();
      const hasDeadlineHint =
        lowered.includes("prazo") ||
        lowered.includes("intim") ||
        lowered.includes("manifest") ||
        lowered.includes("contrarrazo");

      return {
        externalId: item.id ? String(item.id) : undefined,
        date: item.dataPublicacao || item.dataDisponibilizacao || new Date().toISOString(),
        source: "DJEN",
        title: item.titulo || item.tipoComunicacao || "Publicacao processual",
        content,
        hasDeadlineHint,
        rawPayload: item,
      };
    });
  }
}
