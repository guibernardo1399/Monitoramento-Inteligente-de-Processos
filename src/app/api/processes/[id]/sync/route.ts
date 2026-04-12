import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/session";
import { syncProcess } from "@/modules/sync/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await syncProcess(id, user.officeId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao sincronizar processo." },
      { status: 400 },
    );
  }
}
