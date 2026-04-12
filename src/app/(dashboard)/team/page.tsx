import { TeamMemberForm } from "@/components/forms/team-member-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db/prisma";
import { requireUser } from "@/server/auth/session";

export default async function TeamPage() {
  const user = await requireUser();
  const members = await prisma.user.findMany({
    where: { officeId: user.officeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <h2 className="text-xl font-semibold text-ink">Equipe do escritorio</h2>
        <p className="mt-2 text-sm text-steel">
          O proprietario pode criar acessos de membros para advogados associados e equipe interna.
        </p>
        {user.role === "OWNER" ? (
          <div className="mt-5">
            <TeamMemberForm />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-mist/70 p-4 text-sm text-steel">
            Somente o proprietario do escritorio pode criar novos membros.
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-ink">Usuarios vinculados</h2>
        <div className="mt-5 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-2xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{member.name}</h3>
                  <p className="text-sm text-steel">{member.email}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                  {member.role === "OWNER" ? "Proprietario" : "Membro"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
