import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { getDashboardData } from "@/modules/dashboard/queries";

export async function GET() {
  const user = await requireUser();
  const data = await getDashboardData(user.officeId);
  return NextResponse.json(data);
}
