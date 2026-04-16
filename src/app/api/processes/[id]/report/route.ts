import { NextResponse } from "next/server";
import { generateProcessPdfReport } from "@/modules/processes/report";
import { requireUser } from "@/server/auth/session";
import { getProcessDetails } from "@/modules/processes/queries";
import { guardRequest, secureJson, secureResponse, handleRouteError } from "@/server/security/http";

function buildClientReportFilename(clientName: string) {
  const normalized = clientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return normalized || "cliente";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await guardRequest(request, {
      rateLimit: {
        bucket: "processes-report",
        limit: 30,
        windowMs: 10 * 60 * 1000,
      },
    });

    const user = await requireUser();
    const { id } = await params;
    const process = await getProcessDetails(id, user.officeId, user.id, user.role === "OWNER");

    if (!process) {
      return secureJson({ error: "Processo nao encontrado." }, { status: 404 });
    }

    const pdf = await generateProcessPdfReport(process);

    return secureResponse(
      new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio-${buildClientReportFilename(process.client.name)}.pdf"`,
        },
      }),
    );
  } catch (error) {
    return handleRouteError(error, "Nao foi possivel gerar o relatorio.");
  }
}
