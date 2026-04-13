import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { datajudConnector } from "@/connectors";
import { processCreateSchema } from "@/lib/validators";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { syncProcess } from "@/modules/sync/service";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = processCreateSchema.parse(await request.json());
    const internalResponsibleId =
      user.role === "OWNER" ? body.internalResponsibleId || null : user.id;

    if (user.role !== "OWNER" && body.internalResponsibleId && body.internalResponsibleId !== user.id) {
      return NextResponse.json(
        { error: "Membros so podem criar processos sob a propria responsabilidade." },
        { status: 403 },
      );
    }

    let snapshot = null;

    try {
      snapshot = await datajudConnector.fetchProcessByCNJ(body.cnjNumber);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel consultar o processo no momento.";

      return NextResponse.json(
        {
          error: env.useMockConnectors
            ? `Nao foi possivel localizar esse processo na base de demonstracao. ${message}`
            : `Nao foi possivel consultar o processo nas fontes configuradas. Verifique o numero CNJ e tente novamente. ${message}`,
        },
        { status: 502 },
      );
    }

    if (!snapshot) {
      return NextResponse.json(
        {
          error: env.useMockConnectors
            ? "Nao encontramos esse numero CNJ na base de demonstracao. Tente um dos processos seed ou ative a consulta oficial."
            : "Nao encontramos dados para esse numero CNJ nas fontes configuradas. Verifique o numero informado e tente novamente.",
        },
        { status: 404 },
      );
    }

    const process = await prisma.process.create({
      data: {
        officeId: user.officeId,
        clientId: body.clientId,
        internalResponsibleId,
        cnjNumber: body.cnjNumber,
        lawyerName: body.lawyerName || null,
        lawyerOab: body.lawyerOab || null,
        court: snapshot.court,
        className: snapshot.className,
        subject: snapshot.subject,
        judgingBody: snapshot.judgingBody,
        externalReference: snapshot.externalReference || null,
        notes: body.notes || null,
      },
    });

    if (snapshot.parties?.length) {
      await prisma.processParty.createMany({
        data: snapshot.parties.map((party) => ({
          processId: process.id,
          name: party.name,
          role: party.role,
          document: party.document || null,
        })),
      });
    }

    try {
      const syncResult = await syncProcess(process.id, user.officeId, { publicationMode: "initial" });

      return NextResponse.json({
        id: process.id,
        warning: syncResult.status !== "SUCCESS" ? syncResult.message : null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "O processo foi cadastrado, mas a carga inicial nao terminou como esperado.";

      await prisma.process.update({
        where: { id: process.id },
        data: { monitoringStatus: "ERROR" },
      });

      await prisma.syncLog.create({
        data: {
          officeId: user.officeId,
          processId: process.id,
          source: env.useMockConnectors ? "MOCK" : "DATAJUD",
          startedAt: new Date(),
          finishedAt: new Date(),
          status: "FAILED",
          errorMessage: message,
        },
      });

      return NextResponse.json({
        id: process.id,
        warning: `O processo foi cadastrado, mas a carga inicial nao terminou por completo. ${message}`,
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ja existe um processo cadastrado com esse numero CNJ." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao cadastrar processo." },
      { status: 400 },
    );
  }
}
