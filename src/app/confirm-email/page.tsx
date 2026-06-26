"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ConfirmEmailContent() {
  const params = useSearchParams();
  const sucesso = params.get("sucesso");
  const erro = params.get("erro");

  if (sucesso) return (
    <div className="text-center space-y-6">
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck size={36} className="text-emerald-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-white tracking-wide">Identidade verificada!</h1>
        <p className="text-white/50 text-sm leading-relaxed">
          O seu email foi confirmado com sucesso. O administrador irá agora analisar o seu pedido de acesso e aprovar a sua conta.
        </p>
        <p className="text-white/30 text-xs leading-relaxed pt-1">
          Receberá uma notificação quando a conta estiver activa. Pode fechar esta página.
        </p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro === "token_expirado") return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
        <Clock size={30} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-white">Link expirado</h1>
        <p className="text-white/50 text-sm">O link de confirmação é válido durante 24 horas e já expirou. Registe-se novamente para receber um novo link.</p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro) return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
        <XCircle size={30} className="text-red-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-white">Link inválido</h1>
        <p className="text-white/50 text-sm">Este link de confirmação não é válido ou já foi utilizado anteriormente.</p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  return (
    <div className="text-center space-y-4">
      <Loader2 size={36} className="text-blue-400 mx-auto animate-spin" />
      <p className="text-white/50 text-sm">A verificar confirmação...</p>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#13131f] border border-white/[0.06] rounded-3xl p-10 space-y-8">
        <div className="text-center space-y-3">
          <Image src="/logo-sabermais.png" alt="SaberMais" width={120} height={40} className="mx-auto opacity-90" />
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/20">Confirmação de Email</p>
        </div>
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}>
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
