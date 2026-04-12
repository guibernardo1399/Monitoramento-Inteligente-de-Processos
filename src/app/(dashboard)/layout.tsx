import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/server/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] p-4 md:p-6">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Sidebar />
        </div>
        <main className="space-y-4">
          <Topbar officeName={user.office.name} userName={user.name} />
          {children}
        </main>
      </div>
    </div>
  );
}
