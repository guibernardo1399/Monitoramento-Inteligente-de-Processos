import { Scale } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-brand p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Monitoramento juridico</p>
            <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
          </div>
        </div>
        <div className="max-w-xl">
          <h2 className="text-4xl font-semibold leading-tight">
            Atualizacoes processuais em um painel claro, confiavel e pronto para escalar.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/72">
            Centralize processos por CNJ, acompanhe novas movimentacoes e publicacoes, destaque riscos operacionais e mantenha a revisao humana no centro da decisao.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Dashboard diario com alertas priorizados.</div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Conectores prontos para Datajud, DJEN e provedores privados.</div>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </section>
    </div>
  );
}
