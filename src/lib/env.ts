export const env = {
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  authCookieName: process.env.AUTH_COOKIE_NAME || "mip_session",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  datajudBaseUrl: process.env.DATAJUD_BASE_URL || "",
  datajudApiKey: process.env.DATAJUD_API_KEY || "",
  djenBaseUrl: process.env.DJEN_BASE_URL || "",
  djenApiKey: process.env.DJEN_API_KEY || "",
  useMockConnectors: process.env.USE_MOCK_CONNECTORS !== "false",
};
