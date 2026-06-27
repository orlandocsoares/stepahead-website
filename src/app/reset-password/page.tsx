"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, KeyRound, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setTokenError(d.error);
        else setMaskedEmail(d.email);
      })
      .catch(() => setTokenError("Não foi possível validar o link."));
  }, [token]);

  const passwordsMatch = confirm.length === 0 || password === confirm;
  const confirmOk = confirm.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("As passwords não coincidem.");
    if (password.length < 6) return setError("Mínimo 6 caracteres.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao redefinir password.");
      setDone(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token || tokenError) return (
    <div className="text-center space-y-4 py-4">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
        <XCircle size={28} className="text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-semibold text-sm">{tokenError ?? "Link inválido"}</p>
        <p className="text-white/40 text-xs">Solicite um novo link de recuperação.</p>
      </div>
      <Link href="/" className="inline-block px-6 py-2 rounded-full bg-white/[0.06] text-white/60 text-xs hover:bg-white/10 transition-colors">
        Voltar ao Portal
      </Link>
    </div>
  );

  if (!maskedEmail) return (
    <div className="flex justify-center py-6">
      <Loader2 size={20} className="animate-spin text-blue-400" />
    </div>
  );

  if (done) return (
    <div className="text-center space-y-4 py-4">
      <div className="relative mx-auto w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-white font-semibold text-sm">Password redefinida!</p>
        <p className="text-white/40 text-xs leading-relaxed">A sua password foi alterada com sucesso. A redirecionar...</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email mascarado */}
      <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3">
        <Mail size={14} className="text-blue-400 shrink-0" />
        <span className="text-sm text-white/50">{maskedEmail}</span>
      </div>

      {/* Nova password */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/40 uppercase tracking-wider">Nova password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 pr-10 transition-colors"
            placeholder="Mínimo 6 caracteres"
          />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Confirmar password */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/40 uppercase tracking-wider">Confirmar password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={`w-full bg-white/[0.04] border rounded-lg px-4 py-3 text-sm text-white outline-none pr-10 transition-colors ${
              !passwordsMatch
                ? "border-red-500/50 focus:border-red-500/70"
                : confirmOk
                ? "border-emerald-500/50 focus:border-emerald-500/70"
                : "border-white/[0.08] focus:border-blue-500/50"
            }`}
            placeholder="Repetir a nova password"
          />
          {confirm.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {confirmOk
                ? <CheckCircle2 size={15} className="text-emerald-400" />
                : <XCircle size={15} className="text-red-400" />}
            </span>
          )}
        </div>
        {!passwordsMatch && (
          <p className="text-[11px] text-red-400">As passwords não coincidem.</p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !confirmOk}
        className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> A guardar...</> : "Redefinir password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <Image src="/logo-sabermais.png" alt="SaberMais" width={120} height={40} className="mx-auto mix-blend-screen contrast-125 brightness-110" style={{ filter: "drop-shadow(0 0 18px rgba(120,200,255,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.4)) contrast(1.25) brightness(1.1)" }} />
        </div>

        {/* Card com fundo glass */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <KeyRound size={18} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">Redefinir password</h1>
                <p className="text-white/40 text-xs mt-0.5">Escolha uma nova password para a sua conta</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="px-8 py-6">
            <Suspense fallback={<div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}>
              <ResetPasswordForm />
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
