"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

// --- COMPONENTE BOTÃO MAGNÉTICO INTEGRADO PARA EVITAR ERROS DE IMPORTAÇÃO ---
function MagneticButton({ children, className, strength = 0.1 }: any) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * strength;
    const y = (clientY - (top + height / 2)) * strength;
    setPosition({ x, y });
  };
  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      animate={{ x: position.x, y: position.y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? "Credenciais inválidas. Verifique o seu e-mail e password.");
      }

      router.push(json.data?.user?.role === "formando" ? "/dashboard/minhas-formacoes" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* BACKGROUND ATMOSFÉRICO */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[150px] rounded-full" />
      </div>

      {/* CARD DE LOGIN CRYSTAL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-12 rounded-[3.5rem] bg-white/[0.01] border border-white/10 backdrop-blur-3xl shadow-2xl"
      >
        {/* CABEÇALHO */}
        <div className="text-center mb-12 space-y-6">
          <motion.div 
            initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.3 }}
            className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-[1.5rem] mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.2)]"
          >
            <ShieldCheck size={36} className="text-blue-400" strokeWidth={1.5} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extralight text-white uppercase tracking-[0.3em] italic leading-none">
              Saber <span className="opacity-20 not-italic font-bold">Mais</span>
            </h2>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.5em] font-black italic">
              Terminal de Acesso // III Ciclo // Angola
            </p>
          </div>
        </div>

        {/* FORMULÁRIO DE LOGIN */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            {/* Input E-mail */}
            <div className="group relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-all" size={18} />
              <input 
                required type="email" placeholder="E-MAIL INSTITUCIONAL" 
                className="w-full h-16 bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-6 text-[10px] text-white tracking-widest outline-none focus:border-blue-500/40 focus:bg-white/[0.04] transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Input Password */}
            <div className="group relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-all" size={18} />
              <input
                required type={showPassword ? "text" : "password"} placeholder="PALAVRA-PASSE"
                className="w-full h-16 bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-12 text-[10px] text-white tracking-widest outline-none focus:border-blue-500/40 focus:bg-white/[0.04] transition-all"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* MENSAGEM DE ERRO DINÂMICA */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
              >
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTÃO DE ENTRADA */}
          <MagneticButton className="w-full pt-4">
            <button 
              disabled={loading}
              className="w-full h-16 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95 disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Entrar no Portal
                  <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </MagneticButton>
        </form>

        {/* RODAPÉ DO CARD */}
        <div className="mt-12 text-center space-y-4 border-t border-white/5 pt-8 opacity-40">
          <p className="text-[7px] text-white uppercase tracking-[0.4em] leading-relaxed italic">
            Cooperação Estratégica Internacional <br /> 
            <span className="text-blue-500 font-black">Angola • Portugal</span>
          </p>
        </div>
      </motion.div>

      {/* ELEMENTOS DECORATIVOS (PARTÍCULAS) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              y: [0, -150, 0],
              opacity: [0, 1, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ 
              duration: 15 + i * 3, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 2
            }}
            className="absolute w-[1px] h-[1px] bg-white rounded-full"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>
    </main>
  );
}