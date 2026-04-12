import { subDays, subHours } from "date-fns";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.alertDelivery.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.processPublication.deleteMany();
  await prisma.processMovement.deleteMany();
  await prisma.processParty.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.process.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();

  const office = await prisma.office.create({
    data: {
      name: "Rocha & Associados",
      slug: "rocha-associados",
      plan: "professional",
    },
  });

  const owner = await prisma.user.create({
    data: {
      officeId: office.id,
      name: "Mariana Rocha",
      email: "demo@monitoramentojuridico.com",
      passwordHash: await hash("demo1234", 10),
      role: "OWNER",
    },
  });

  const member = await prisma.user.create({
    data: {
      officeId: office.id,
      name: "Felipe Costa",
      email: "felipe@monitoramentojuridico.com",
      passwordHash: await hash("demo1234", 10),
      role: "MEMBER",
    },
  });

  const clientA = await prisma.client.create({
    data: {
      officeId: office.id,
      name: "Inova Tech Ltda.",
      document: "12.345.678/0001-99",
      notes: "Cliente corporativo com alta exigencia de previsibilidade operacional.",
    },
  });

  const clientB = await prisma.client.create({
    data: {
      officeId: office.id,
      name: "Helena Martins",
      document: "123.456.789-10",
      notes: "Cliente pessoa fisica; priorizar atualizacoes claras e sinteticas.",
    },
  });

  const processA = await prisma.process.create({
    data: {
      officeId: office.id,
      clientId: clientA.id,
      internalResponsibleId: owner.id,
      cnjNumber: "5001682-64.2024.8.26.0100",
      lawyerName: "Mariana Rocha",
      lawyerOab: "OAB/SP 123456",
      court: "TJSP",
      className: "Procedimento Comum Civel",
      subject: "Rescisao contratual",
      judgingBody: "12a Vara Civel Central",
      notes: "Possivel sensibilidade comercial; revisar toda publicacao no mesmo dia.",
      lastSyncedAt: subHours(new Date(), 2),
      lastEventAt: subHours(new Date(), 6),
      externalReference: "TJSP-5001682-64.2024.8.26.0100",
    },
  });

  const processB = await prisma.process.create({
    data: {
      officeId: office.id,
      clientId: clientB.id,
      internalResponsibleId: member.id,
      cnjNumber: "1002457-12.2023.8.26.0011",
      lawyerName: "Felipe Costa",
      lawyerOab: "OAB/SP 654321",
      court: "TJSP",
      className: "Execucao de Titulo Extrajudicial",
      subject: "Cobranca",
      judgingBody: "4a Vara Civel Regional",
      notes: "Acompanhar tentativas de citacao e mandados.",
      lastSyncedAt: subDays(new Date(), 1),
      lastEventAt: subDays(new Date(), 1),
      externalReference: "TJSP-1002457-12.2023.8.26.0011",
    },
  });

  await prisma.processParty.createMany({
    data: [
      { processId: processA.id, name: "Inova Tech Ltda.", role: "Requerente", document: "12.345.678/0001-99" },
      { processId: processA.id, name: "Servicos Orion S.A.", role: "Requerida", document: "98.765.432/0001-10" },
      { processId: processB.id, name: "Helena Martins", role: "Exequente", document: "123.456.789-10" },
      { processId: processB.id, name: "Carlos Mota", role: "Executado", document: "987.654.321-00" },
    ],
  });

  await prisma.processMovement.createMany({
    data: [
      {
        processId: processA.id,
        movementDate: subDays(new Date(), 12),
        title: "Distribuicao",
        description: "Processo distribuido para a 12a Vara Civel Central.",
      },
      {
        processId: processA.id,
        movementDate: subDays(new Date(), 4),
        title: "Conclusos para despacho",
        description: "Autos conclusos ao magistrado para analise de tutela.",
      },
      {
        processId: processA.id,
        movementDate: subHours(new Date(), 9),
        title: "Juntada de peticao",
        description: "Peticao intermediaria protocolada pela parte autora.",
      },
      {
        processId: processB.id,
        movementDate: subDays(new Date(), 8),
        title: "Expedicao de mandado",
        description: "Mandado expedido para tentativa de citacao do executado.",
      },
      {
        processId: processB.id,
        movementDate: subDays(new Date(), 1),
        title: "Certidao juntada",
        description: "Certidao do oficial de justica juntada aos autos.",
      },
    ],
  });

  await prisma.processPublication.createMany({
    data: [
      {
        processId: processA.id,
        publicationDate: subHours(new Date(), 6),
        source: "DJEN",
        title: "Intimacao para manifestacao",
        content:
          "Fica a parte autora intimada para se manifestar sobre a contestacao apresentada, nos termos do despacho.",
        hasDeadlineHint: true,
      },
      {
        processId: processB.id,
        publicationDate: subDays(new Date(), 1),
        source: "DJEN",
        title: "Publicacao de certidao",
        content: "Disponibilizada certidao referente ao cumprimento de diligencia pelo oficial de justica.",
        hasDeadlineHint: false,
      },
    ],
  });

  const alertA = await prisma.alert.create({
    data: {
      officeId: office.id,
      processId: processA.id,
      title: "Nova publicacao com potencial prazo",
      message:
        "Intimacao identificada no DJEN com potencial reflexo de prazo. Revisao humana imediata recomendada.",
      severity: "CRITICAL",
      status: "UNREAD",
      requiresHumanReview: true,
    },
  });

  const alertB = await prisma.alert.create({
    data: {
      officeId: office.id,
      processId: processB.id,
      title: "Nova publicacao processual",
      message: "Nova comunicacao encontrada para o processo. Revisao humana recomendada.",
      severity: "ATTENTION",
      status: "READ",
      requiresHumanReview: true,
    },
  });

  await prisma.alertDelivery.createMany({
    data: [
      {
        alertId: alertA.id,
        channel: "in_app",
        target: owner.email,
        sentAt: subHours(new Date(), 5),
        status: "delivered",
      },
      {
        alertId: alertB.id,
        channel: "in_app",
        target: member.email,
        sentAt: subHours(new Date(), 20),
        status: "delivered",
      },
    ],
  });

  await prisma.syncLog.createMany({
    data: [
      {
        officeId: office.id,
        processId: processA.id,
        source: "MOCK",
        startedAt: subHours(new Date(), 2),
        finishedAt: subHours(new Date(), 2),
        status: "SUCCESS",
        externalReference: processA.externalReference,
      },
      {
        officeId: office.id,
        processId: processB.id,
        source: "MOCK",
        startedAt: subDays(new Date(), 1),
        finishedAt: subDays(new Date(), 1),
        status: "SUCCESS",
        externalReference: processB.externalReference,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
