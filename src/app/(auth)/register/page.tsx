import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand">Novo escritorio</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">Criar conta</h2>
        <p className="mt-3 text-sm leading-6 text-steel">
          Estrutura simples para multiusuario, com escritorio, usuarios e monitoramento pronto para evolucao comercial.
        </p>
      </div>
      <AuthForm mode="register" />
      <p className="text-center text-sm text-steel">
        Ja possui acesso?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Entrar
        </Link>
      </p>
    </div>
  );
}
