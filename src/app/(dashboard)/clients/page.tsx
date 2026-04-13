import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { ClientForm } from "@/components/forms/client-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await prisma.client.findMany({
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
    select: {
      id: true,
      name: true,
      document: true,
      notes: true,
      _count: {
        select: {
          processes: user.role === "OWNER" ? true : { where: { internalResponsibleId: user.id } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <h2 className="text-xl font-semibold text-ink">Cadastro de clientes</h2>
        <p className="mt-2 text-sm text-steel">
          {user.role === "OWNER"
            ? "Base centralizada para vincular processos, anotar contexto e preparar operacao multiusuario."
            : "Visualize os clientes ligados aos processos sob sua responsabilidade."}
        </p>
        {user.role === "OWNER" ? (
          <div className="mt-5">
            <ClientForm />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-mist/70 p-4 text-sm text-steel">
            Somente o proprietario pode cadastrar novos clientes.
          </div>
        )}
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
                  {client._count.processes} processo(s)
                </span>
              </div>
              {client.notes ? <p className="mt-3 text-sm text-steel">{client.notes}</p> : null}
              {user.role === "OWNER" ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {client._count.processes > 0
                      ? "Apague primeiro os processos vinculados para remover este cliente."
                      : "Cliente sem processos vinculados."}
                  </p>
                  <DeleteClientButton
                    clientId={client.id}
                    disabled={client._count.processes > 0}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
