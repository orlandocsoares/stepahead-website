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
    <div className="text-center space-y-4 py-2">
      <div className="relative mx-auto w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck size={28} className="text-emerald-400" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h1 className="text-white font-semibold text-base">Identidade verificada!</h1>
        <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
          O seu email foi confirmado com sucesso. O administrador irá analisar o seu pedido e aprovar a conta.
        </p>
        <p className="text-white/25 text-[11px] leading-relaxed pt-1">
          Receberá uma notificação quando a conta estiver activa. Pode fechar esta página.
        </p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro === "token_expirado") return (
    <div className="text-center space-y-4 py-2">
      <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
        <Clock size={28} className="text-amber-400" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-white font-semibold text-base">Link expirado</h1>
        <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
          O link de confirmação é válido durante 24 horas e já expirou. Registe-se novamente para receber um novo link.
        </p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-white/[0.06] text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro) return (
    <div className="text-center space-y-4 py-2">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
        <XCircle size={28} className="text-red-400" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-white font-semibold text-base">Link inválido</h1>
        <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
          Este link de confirmação não é válido ou já foi utilizado anteriormente.
        </p>
      </div>
      <Link href="/" className="inline-block px-8 py-2.5 rounded-full bg-white/[0.06] text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
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
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo + intro */}
        <div className="text-center space-y-3">
          <Image src="/logo-sabermais.png" alt="SaberMais" width={130} height={44} className="mx-auto opacity-90" />
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/20">Confirmação de Email</p>
        </div>

        {/* Card */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-8">
          <Suspense fallback={<div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}>
            <ConfirmEmailContent />
          </Suspense>
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
