"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

function ConfirmEmailContent() {
  const params = useSearchParams();
  const sucesso = params.get("sucesso");
  const erro = params.get("erro");

  if (sucesso) return (
    <div className="text-center space-y-4">
      <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
      <h1 className="text-lg font-semibold text-white">Email confirmado!</h1>
      <p className="text-white/50 text-sm leading-relaxed">
        O seu email foi verificado com sucesso. A sua conta está agora a aguardar aprovação pelo administrador. Será notificado quando estiver activa.
      </p>
      <Link href="/" className="inline-block mt-4 px-6 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro === "token_expirado") return (
    <div className="text-center space-y-4">
      <Clock size={48} className="text-amber-400 mx-auto" />
      <h1 className="text-lg font-semibold text-white">Link expirado</h1>
      <p className="text-white/50 text-sm">O link de confirmação expirou (válido 24 horas). Por favor registe-se novamente.</p>
      <Link href="/" className="inline-block mt-4 px-6 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (erro) return (
    <div className="text-center space-y-4">
      <XCircle size={48} className="text-red-400 mx-auto" />
      <h1 className="text-lg font-semibold text-white">Link inválido</h1>
      <p className="text-white/50 text-sm">Este link de confirmação não é válido ou já foi utilizado.</p>
      <Link href="/" className="inline-block mt-4 px-6 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  return (
    <div className="text-center space-y-4">
      <Loader2 size={48} className="text-blue-400 mx-auto animate-spin" />
      <p className="text-white/50 text-sm">A processar confirmação...</p>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#13131f] border border-white/[0.06] rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Portal Saber Mais</p>
          <h2 className="text-base font-light uppercase tracking-widest mt-1">Confirmação de Email</h2>
        </div>
        <Suspense fallback={<div className="flex justify-center"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}>
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
