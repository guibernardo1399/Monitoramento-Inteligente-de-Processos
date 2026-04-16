import { NextRequest, NextResponse } from "next/server";

function getAllowedOrigin() {
  try {
    return new URL(process.env.APP_URL || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

function buildCorsHeaders(request: NextRequest) {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin();

  headers.set("Vary", "Origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "same-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (origin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Cron-Secret");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }

  return headers;
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const headers = buildCorsHeaders(request);
  const origin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin();

  if (request.method === "OPTIONS") {
    if (!origin || origin !== allowedOrigin) {
      return new NextResponse(JSON.stringify({ error: "Origem não permitida." }), {
        status: 403,
        headers,
      });
    }

    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
