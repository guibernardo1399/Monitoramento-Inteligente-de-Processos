import { Search } from "lucide-react";

export function Topbar({ officeName, userName }: { officeName: string; userName: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-steel">Operacao do escritorio</p>
        <h2 className="text-2xl font-semibold text-ink">Bom trabalho, {userName.split(" ")[0]}</h2>
        <p className="text-sm text-steel">{officeName}</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-steel md:min-w-80">
        <Search className="h-4 w-4" />
        <span>Busca rapida por CNJ, cliente ou assunto</span>
      </div>
    </div>
  );
}
