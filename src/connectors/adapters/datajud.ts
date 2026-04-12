import { env } from "@/lib/env";
import type { ProcessDataConnector } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";

export class DatajudConnector implements ProcessDataConnector {
  key = "DATAJUD";
  supportsLiveData = Boolean(env.datajudBaseUrl && env.datajudApiKey);

  async fetchProcessByCNJ(cnjNumber: string) {
    if (!this.supportsLiveData || env.useMockConnectors) {
      return mockProcessSnapshots[cnjNumber] ?? null;
    }

    return null;
  }
}
