import { getCloudflareContext } from "@opennextjs/cloudflare";

function readCloudflareBinding(name: string) {
  try {
    const context = getCloudflareContext();
    const value = context?.env?.[name as keyof typeof context.env];

    if (typeof value === "string") {
      return value;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function readEnv(name: string, fallback = "") {
  return process.env[name] || readCloudflareBinding(name) || fallback;
}

function readNumberEnv(name: string, fallback: number) {
  const value = readEnv(name, String(fallback));
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBooleanEnv(name: string, fallback: boolean) {
  const value = readEnv(name, fallback ? "true" : "false");
  return value !== "false";
}

export const env = {
  get databaseUrl() {
    return readEnv("DATABASE_URL");
  },
  get directUrl() {
    return readEnv("DIRECT_URL");
  },
  get authCookieName() {
    return readEnv("AUTH_COOKIE_NAME", "mip_session");
  },
  get appUrl() {
    return readEnv("APP_URL", "http://localhost:3000");
  },
  get cronSecret() {
    return readEnv("CRON_SECRET");
  },
  get datajudBaseUrl() {
    return readEnv("DATAJUD_BASE_URL");
  },
  get datajudApiKey() {
    return readEnv("DATAJUD_API_KEY");
  },
  get datajudUsePublicKeyFallback() {
    return readBooleanEnv("DATAJUD_USE_PUBLIC_KEY_FALLBACK", true);
  },
  get datajudTribunalAlias() {
    return readEnv("DATAJUD_TRIBUNAL_ALIAS");
  },
  get datajudTimeoutMs() {
    return readNumberEnv("DATAJUD_TIMEOUT_MS", 15000);
  },
  get djenBaseUrl() {
    return readEnv("DJEN_BASE_URL");
  },
  get djenApiPath() {
    return readEnv("DJEN_API_PATH", "/api/v1/comunicacao");
  },
  get djenTimeoutMs() {
    return readNumberEnv("DJEN_TIMEOUT_MS", 15000);
  },
  get djenInitialLookbackDays() {
    return readNumberEnv("DJEN_INITIAL_LOOKBACK_DAYS", 180);
  },
  get djenIncrementalLookbackDays() {
    return readNumberEnv("DJEN_INCREMENTAL_LOOKBACK_DAYS", 15);
  },
  get useMockConnectors() {
    return readBooleanEnv("USE_MOCK_CONNECTORS", true);
  },
};
