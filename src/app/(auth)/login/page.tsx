import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand">Acesso seguro</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">Entrar no painel</h2>
        <p className="mt-3 text-sm leading-6 text-steel">
          Use a conta demo seeded ou crie um novo escritorio para explorar o fluxo completo.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="text-center text-sm text-steel">
        Ainda nao tem conta?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Criar escritorio
        </Link>
      </p>
    </div>
  );
}
