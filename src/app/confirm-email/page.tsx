"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ConfirmEmailContent() {
  const params = useSearchParams();
  const sucesso = params.get("sucesso");
  const erro = params.get("erro");

  if (sucesso) return (
    <div className="text-center space-y-5 py-2">
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={30} className="text-emerald-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-white font-semibold text-base">Identidade confirmada!</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          O seu email foi verificado com sucesso.
        </p>
        <p className="text-white/30 text-xs leading-relaxed max-w-xs mx-auto pt-1">
          A sua conta está a aguardar aprovação por parte do administrador. Receberá uma notificação quando estiver activa.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors"
      >
        Ir para o Portal <ArrowRight size={13} />
      </Link>
    </div>
  );

  if (erro === "token_expirado") return (
    <div className="text-center space-y-5 py-2">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
        <Clock size={30} className="text-amber-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-white font-semibold text-base">Link expirado</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          O link de confirmação é válido durante 24 horas e já expirou.
        </p>
        <p className="text-white/30 text-xs leading-relaxed max-w-xs mx-auto">
          Registe-se novamente para receber um novo link de verificação.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.08] text-white/70 text-xs font-bold uppercase tracking-widest hover:bg-white/15 transition-colors"
      >
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro) return (
    <div className="text-center space-y-5 py-2">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
        <XCircle size={30} className="text-red-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-white font-semibold text-base">Link inválido</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
          Este link de confirmação não é válido ou já foi utilizado anteriormente.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.08] text-white/70 text-xs font-bold uppercase tracking-widest hover:bg-white/15 transition-colors"
      >
        Voltar ao Portal
      </Link>
    </div>
  );

  return (
    <div className="text-center space-y-4 py-2">
      <Loader2 size={32} className="text-blue-400 mx-auto animate-spin" />
      <p className="text-white/40 text-sm">A verificar confirmação...</p>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <Image src="/logo-sabermais.png" alt="SaberMais" width={120} height={40} className="mx-auto mix-blend-screen contrast-125 brightness-110" style={{ filter: "drop-shadow(0 0 18px rgba(120,200,255,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.4)) contrast(1.25) brightness(1.1)" }} />
        </div>

        {/* Card glass */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-8 pt-6 pb-2 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/25 text-center pb-4">Confirmação de identidade</p>
          </div>
          <div className="px-8 py-7">
            <Suspense fallback={<div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}>
              <ConfirmEmailContent />
            </Suspense>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-center gap-2 text-white/20">
          <ShieldCheck size={12} />
          <span className="text-[10px]">Ligação segura · sabermais.edu.ao</span>
        </div>

      </div>
    </div>
  );
}
