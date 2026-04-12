"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BriefcaseBusiness, LayoutDashboard, LogOut, Scale, Siren, UserCog, Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/processes", label: "Processos", icon: Scale },
  { href: "/alerts", label: "Alertas", icon: Siren },
  { href: "/team", label: "Equipe", icon: UserCog },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <aside className="flex h-full flex-col rounded-[28px] bg-brand px-5 py-6 text-white shadow-panel">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/80">
          SaaS juridico
        </div>
        <div className="mt-4 flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-white/70">Monitoramento premium</p>
            <h1 className="max-w-[11rem] text-lg font-semibold leading-tight">{APP_NAME}</h1>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active ? "bg-white text-brand" : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4" />
            Revisao humana
          </div>
          <p className="mt-2 text-sm text-white/70">
            Alertas sao apoio operacional. A validacao juridica final continua com o escritorio.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </aside>
  );
}
