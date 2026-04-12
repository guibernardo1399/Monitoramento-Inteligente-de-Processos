import { ProcessForm } from "@/components/forms/process-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export default async function NewProcessPage() {
  const user = await requireUser();
  const [clients, users] = await Promise.all([
    prisma.client.findMany({
      where: {
        officeId: user.officeId,
        ...(user.role === "OWNER"
          ? {}
          : {
              processes: {
                some: {
                  internalResponsibleId: user.id,
                },
              },
            }),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: user.role === "OWNER" ? { officeId: user.officeId } : { id: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Card>
      <h2 className="text-xl font-semibold text-ink">Cadastrar processo</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
        Informe o numero CNJ para puxar metadados pelo conector configurado. No modo demo, o sistema usa adaptadores mockados para manter o fluxo funcional sem depender de credenciais externas.
      </p>
      <div className="mt-6">
        <ProcessForm clients={clients} responsibles={users} currentUserId={user.id} isOwner={user.role === "OWNER"} />
      </div>
    </Card>
  );
}
