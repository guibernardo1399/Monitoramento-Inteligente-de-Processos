import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clearSession } from "@/server/auth/session";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(new URL("/login", env.appUrl), { status: 303 });
}
