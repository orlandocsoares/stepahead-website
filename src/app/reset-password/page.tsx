"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, KeyRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!token) return (
    <div className="text-center space-y-4 py-4">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
        <XCircle size={28} className="text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-semibold text-sm">Link inválido</p>
        <p className="text-white/40 text-xs">Este link de recuperação não é válido. Solicite um novo.</p>
      </div>
      <Link href="/" className="inline-block px-6 py-2 rounded-full bg-white/[0.06] text-white/60 text-xs hover:bg-white/10 transition-colors">
        Voltar ao Portal
      </Link>
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
        <p className="text-white/40 text-xs leading-relaxed">A sua password foi alterada com sucesso. A redirecionar para o portal...</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/40 uppercase tracking-wider">Confirmar password</label>
        <input
          type={show ? "text" : "password"}
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
          placeholder="Repetir password"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 size={15} className="animate-spin" /> A guardar...</> : "Redefinir password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo + intro */}
        <div className="text-center space-y-4">
          <Image src="/logo-sabermais.png" alt="SaberMais" width={130} height={44} className="mx-auto opacity-90" />
          <div className="space-y-1.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <KeyRound size={22} className="text-blue-400" />
            </div>
            <h1 className="text-white font-semibold text-base">Redefinir password</h1>
            <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
              Escolha uma nova password para a sua conta. Após guardar, pode iniciar sessão normalmente.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-8">
          <Suspense fallback={<div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-2 text-white/20">
          <ShieldCheck size={12} />
          <span className="text-[10px]">Ligação segura · sabermais.edu.ao</span>
        </div>

      </div>
    </div>
  );
}
