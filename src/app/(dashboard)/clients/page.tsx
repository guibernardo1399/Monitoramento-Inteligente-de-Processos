import { ClientForm } from "@/components/forms/client-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await prisma.client.findMany({
    where: { officeId: user.officeId },
    include: {
      processes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <h2 className="text-xl font-semibold text-ink">Cadastro de clientes</h2>
        <p className="mt-2 text-sm text-steel">
          Base centralizada para vincular processos, anotar contexto e preparar operacao multiusuario.
        </p>
        <div className="mt-5">
          <ClientForm />
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold text-ink">Clientes do escritorio</h2>
        <div className="mt-5 space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{client.name}</h3>
                  <p className="text-sm text-steel">{client.document || "Documento nao informado"}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                  {client.processes.length} processo(s)
                </span>
              </div>
              {client.notes ? <p className="mt-3 text-sm text-steel">{client.notes}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
