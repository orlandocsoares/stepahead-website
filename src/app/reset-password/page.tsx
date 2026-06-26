"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

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
    <div className="text-center space-y-2">
      <XCircle size={40} className="text-red-400 mx-auto" />
      <p className="text-white/60 text-sm">Link inválido.</p>
    </div>
  );

  if (done) return (
    <div className="text-center space-y-3">
      <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
      <p className="text-white font-semibold">Password redefinida com sucesso!</p>
      <p className="text-white/40 text-xs">A redirecionar para a página inicial...</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wider">Nova password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 pr-10"
            placeholder="Mínimo 6 caracteres"
          />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-wider">Confirmar password</label>
        <input
          type={show ? "text" : "password"}
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
          placeholder="Repetir password"
        />
      </div>
      {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        Redefinir password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#13131f] border border-white/[0.06] rounded-2xl p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-white">Redefinir password</h1>
          <p className="text-xs text-white/40">Introduza a sua nova password para aceder à conta SaberMais.</p>
        </div>
        <Suspense fallback={<div className="flex justify-center"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
