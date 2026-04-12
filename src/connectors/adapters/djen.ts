import { env } from "@/lib/env";
import type { PublicationConnector } from "@/connectors/types";
import { mockProcessSnapshots } from "@/connectors/mocks/mock-data";

export class DjenConnector implements PublicationConnector {
  key = "DJEN";
  supportsLiveData = Boolean(env.djenBaseUrl && env.djenApiKey);

  async fetchPublicationsByCNJ(cnjNumber: string) {
    if (!this.supportsLiveData || env.useMockConnectors) {
      return mockProcessSnapshots[cnjNumber]?.publications ?? [];
    }

    return [];
  }
}
