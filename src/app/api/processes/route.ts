import { NextResponse } from "next/server";
import { datajudConnector } from "@/connectors";
import { processCreateSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { syncProcess } from "@/modules/sync/service";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = processCreateSchema.parse(await request.json());
    const snapshot = await datajudConnector.fetchProcessByCNJ(body.cnjNumber);

    const process = await prisma.process.create({
      data: {
        officeId: user.officeId,
        clientId: body.clientId,
        internalResponsibleId: body.internalResponsibleId || null,
        cnjNumber: body.cnjNumber,
        lawyerName: body.lawyerName || null,
        lawyerOab: body.lawyerOab || null,
        court: snapshot?.court || "Fonte demo",
        className: snapshot?.className || "Classe pendente de sincronizacao",
        subject: snapshot?.subject || "Assunto pendente de sincronizacao",
        judgingBody: snapshot?.judgingBody || "Orgao julgador pendente",
        externalReference: snapshot?.externalReference || null,
        notes: body.notes || null,
      },
    });

    if (snapshot?.parties?.length) {
      await prisma.processParty.createMany({
        data: snapshot.parties.map((party) => ({
          processId: process.id,
          name: party.name,
          role: party.role,
          document: party.document || null,
        })),
      });
    }

    await syncProcess(process.id, user.officeId);

    return NextResponse.json({ id: process.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao cadastrar processo." },
      { status: 400 },
    );
  }
}
