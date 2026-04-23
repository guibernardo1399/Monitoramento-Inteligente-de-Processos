import { TextEncoder } from "util";
import { ZodSchema } from "zod";
import { NextResponse } from "next/server";

const encoder = new TextEncoder();

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
  key?: string;
};

type GuardRequestOptions = {
  rateLimit?: RateLimitOptions;
  requireSameOrigin?: boolean;
  allowMissingOrigin?: boolean;
};

type GuardJsonRequestOptions<T> = GuardRequestOptions & {
  schema: ZodSchema<T>;
  maxBytes?: number;
};

const globalForSecurity = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalForSecurity.__rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalForSecurity.__rateLimitStore) {
  globalForSecurity.__rateLimitStore = rateLimitStore;
}

export class HttpSecurityError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpSecurityError";
    this.status = status;
  }
}

function getConfiguredOrigin() {
  try {
    return new URL(process.env.APP_URL || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

function getRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getRequestRefererOrigin(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function getRequestUrlOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request) {
  return new Set(
    [getConfiguredOrigin(), getRequestUrlOrigin(request)].filter(Boolean) as string[],
  );
}

function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function cleanupExpiredRateLimits(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function applyRateLimit(request: Request, options?: RateLimitOptions) {
  if (!options) return;

  const now = Date.now();
  cleanupExpiredRateLimits(now);

  const key = `${options.bucket}:${options.key || getRequestIp(request)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (current.count >= options.limit) {
    throw new HttpSecurityError("Muitas tentativas em pouco tempo. Tente novamente em instantes.", 429);
  }

  current.count += 1;
  rateLimitStore.set(key, current);
}

function ensureSameOrigin(request: Request, allowMissingOrigin = false) {
  const origin = getRequestOrigin(request);
  const refererOrigin = getRequestRefererOrigin(request);
  const fetchSite = request.headers.get("sec-fetch-site");
  const allowedOrigins = getAllowedOrigins(request);

  if (!origin) {
    if (refererOrigin && allowedOrigins.has(refererOrigin)) return;
    if (fetchSite === "same-origin" || fetchSite === "same-site") return;
    if (allowMissingOrigin) return;
    throw new HttpSecurityError("Origem da requisição não permitida.", 403);
  }

  if (!allowedOrigins.has(origin)) {
    throw new HttpSecurityError("Origem da requisição não permitida.", 403);
  }
}

function ensureJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpSecurityError("Conteúdo da requisição inválido.", 415);
  }
}

function ensureBodySize(request: Request, rawBody: string, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxBytes) {
    throw new HttpSecurityError("Corpo da requisição excede o limite permitido.", 413);
  }

  if (encoder.encode(rawBody).length > maxBytes) {
    throw new HttpSecurityError("Corpo da requisição excede o limite permitido.", 413);
  }
}

export async function guardRequest(request: Request, options: GuardRequestOptions = {}) {
  if (options.requireSameOrigin) {
    ensureSameOrigin(request, options.allowMissingOrigin);
  }

  applyRateLimit(request, options.rateLimit);
}

export async function guardJsonRequest<T>(
  request: Request,
  options: GuardJsonRequestOptions<T>,
) {
  await guardRequest(request, options);
  ensureJsonContentType(request);

  const rawBody = await request.text();
  ensureBodySize(request, rawBody, options.maxBytes || 16 * 1024);

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new HttpSecurityError("JSON inválido.", 400);
  }

  return options.schema.parse(parsed);
}

export function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export function secureJson(data: unknown, init?: ResponseInit) {
  return withSecurityHeaders(NextResponse.json(data, init));
}

export function secureResponse(response: NextResponse) {
  return withSecurityHeaders(response);
}

export function handleRouteError(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  console.error("[API] Route error", {
    fallbackMessage,
    message: error instanceof Error ? error.message : "Erro desconhecido",
    name: error instanceof Error ? error.name : "UnknownError",
  });

  if (error instanceof HttpSecurityError) {
    return secureJson({ error: error.message }, { status: error.status });
  }

  return secureJson(
    {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: fallbackStatus },
  );
}
