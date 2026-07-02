"use client";

import { HeroBranding } from "./HeroBranding";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, AnimatePresence, animate } from "framer-motion";
import { LogIn, LogOut, User, Camera, GraduationCap, UserCheck, Calendar, FileText, Users, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { DASHBOARD_URL } from "@/lib/program-config";

// IMPORTS EXTERNOS
import { PhasesSidebar } from "./PhasesSidebar";
import { Navigator } from "./Navigator";
import { HelpGuide } from "./HelpGuide";
import { BASE_FRAME_URL } from "@/lib/program-config";

const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;

const EDUCATIONAL_ELEMENTS = [
"E = mc²", "H₂O", "∫ f(x) dx", "F = ma", "πr²", "CO₂", "Ser / Estar",
"x² + y² = z²", "∑", "NaCl", "v = d/t", "A, E, I, O, U", "∞",
"Δp ≥ ℏ/2", "O₂", "Sujeito + Verbo", "C₆H₁₂O₆", "a² + b² = c²",
"H₂SO₄", "lim(x→∞)", "V = R·I", "log(x)", "sin²θ + cos²θ = 1", "√x",
"∇ × E = -∂B/∂t", "i² = -1", "F = G(m₁m₂)/r²", "e^(iπ) + 1 = 0",
"λ = h/p", "PV = nRT", "C = 2πr", "S = k log W"
];

const PROGRAM_PHASES = [
{ id: "fase-0", focusFrame: 8, subtitle: "Acesso à Plataforma", name: "Login", description: "Aceda à área reservada para professores e agentes educativos. Faça login para explorar os módulos, materiais didácticos e progresso." },
{ id: "fase-1", focusFrame: 39, subtitle: "III Ciclo - Angola", name: "Saber Mais", description: "Programa de Cooperação Bilateral entre Portugal e Angola, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola-INFQE." },
{ id: "fase-2", focusFrame: 66, subtitle: "Objectivo Geral", name: "Capacitação", description: "Capacitar e valorizar os recursos humanos do sistema educativo angolano, priorizando os agentes do Ensino Secundário Pedagógico." },
{ id: "fase-3", focusFrame: 86, subtitle: "Modelo de Supervisão", name: "Par Pedagógico", description: "Promoção da supervisão em modelo de par pedagógico e a institucionalização de Centros de Recursos nas comunidades." },
{ id: "fase-4", focusFrame: 151, subtitle: "Impacto Regional", name: "Luanda & Bié", description: "O projecto está presente em duas províncias chave: Bié e Luanda, com foco na elevação da qualidade do ensino no 2º ciclo." },
{ id: "fase-5", focusFrame: 210, subtitle: "Apoio Contínuo", name: "Recursos", description: "Disponibilização de materiais pedagógicos inovadores e guias práticos para apoiar os professores nas salas de aula diariamente." },
{ id: "fase-6", focusFrame: 260, subtitle: "Avaliação de Impacto", name: "Monitorização", description: "Acompanhamento rigoroso dos indicadores de sucesso para garantir a eficácia e a sustentabilidade do projecto a longo prazo." }
];

// COMPONENTE: LOOP DE FORMADORES (Infografia Dinâmica Refinada)
function FormadoresLoop({ formadores }: { formadores: any[] }) {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => {
    if (!formadores || formadores.length <= 1) return;
    const interval = setInterval(() => setIdx(p => (p + 1) % formadores.length), 4500);
    return () => clearInterval(interval);
  }, [formadores]);

  if (!formadores || formadores.length === 0) return null;
  const f = formadores[idx];
  const avatar = f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${f.first_name}&backgroundColor=ffffff&textColor=000000`;

  // Sanitizar especialidade: pode vir como JSON array com emails misturados
  function sanitizeEspecialidade(raw: any): string {
    if (!raw) return "Formador Credenciado";
    let val = raw;
    // Tentar fazer parse se parecer JSON
    if (typeof val === "string" && val.trim().startsWith("[")) {
      try { val = JSON.parse(val); } catch {}
    }
    // Se for array, filtrar emails e juntar
    if (Array.isArray(val)) {
      const clean = val
        .map((s: any) => String(s).trim())
        .filter(s => !s.includes("@") && s.length > 0);
      return clean.join(" · ") || "Formador Credenciado";
    }
    // String simples: remover emails inline
    return String(val).replace(/\S+@\S+\.\S+/g, "").replace(/[,;]\s*$/, "").trim() || "Formador Credenciado";
  }

  const especialidade = sanitizeEspecialidade(f.especialidade);
  const bio = f.biografia?.trim() || "";

  const initials = `${f.first_name?.[0] ?? ""}${f.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative w-[620px] max-w-[90vw]">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none rounded-2xl" />
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="flex items-start gap-4 w-full"
        >
          <div className="relative shrink-0">
            {f.avatar_url ? (
              <img src={f.avatar_url} className="w-14 h-14 rounded-full border-2 border-blue-400/50 object-cover shadow-[0_0_15px_rgba(59,130,246,0.4)]" alt={f.first_name} />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-blue-400/50 bg-blue-600/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                <span className="text-lg font-bold text-blue-300">{initials}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-black">
              <UserCheck size={10} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-base md:text-lg text-white font-bold tracking-tight leading-tight">{f.first_name} {f.last_name}</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-[0.15em] font-medium mt-0.5 line-clamp-1">{especialidade}</span>
            {bio && (
              <span className="text-xs text-white/55 mt-1.5 font-light leading-relaxed line-clamp-3">{bio}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface HeroSectionProps {
  isDashboardView?: boolean;
}

export function HeroSection({ isDashboardView = false }: HeroSectionProps) {
const containerRef = useRef<HTMLDivElement>(null);
const router = useRouter();

const [user, setUser] = useState<any>(null);
const [isLoginOpen, setIsLoginOpen] = useState(false);
const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [role, setRole] = useState('formando');
const [error, setError] = useState<string | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [activePhaseIndex, setActivePhaseIndex] = useState(0);
const [hasInteracted, setHasInteracted] = useState(false);
const [isHovering, setIsHovering] = useState(false);
const [isLogoHovered, setIsLogoHovered] = useState(false);
const [helpOpen, setHelpOpen] = useState(false);

const [telemetry, setTelemetry] = useState<any>(null);

const mouseX = useMotionValue(-100);
const mouseY = useMotionValue(-100);
const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
const isCooldown = useRef(false);
const scrollIntent = useRef(0);

useEffect(() => {
  fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
    if (d?.user) setUser(d.user);
  }).catch(() => {});
}, []);

// CAPTURA DA TELEMETRIA VIA API PRÓPRIA (PostgreSQL) + RECURSOS PÚBLICOS
useEffect(() => {
  const fetchTelemetry = async () => {
    if (isDashboardView) return;
    const [statsJson, recursosJson] = await Promise.all([
      fetch('/api/hero-stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/recursos').then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    const recursosPublicos: any[] = recursosJson.data ?? [];
    const areasCounts: Record<string, number> = {};
    for (const r of recursosPublicos) {
      areasCounts[r.area] = (areasCounts[r.area] ?? 0) + 1;
    }
    const areasPublicas = Object.entries(areasCounts).map(([area, total]) => ({ area, total }));
    setTelemetry({
      ...statsJson,
      recursos_publicos: recursosPublicos,
      areas_publicas: areasPublicas,
      total_recursos_publicos: recursosPublicos.length,
    });
  };
  fetchTelemetry();
}, [isDashboardView]);

const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  router.refresh();
};

const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
setError(null);
try {
  const res = await fetch("/api/auth/session-by-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) { setError(data.error ?? "Erro ao autenticar."); return; }
  setIsLoginOpen(false);
  router.push("/dashboard");
} catch {
  setError("Erro de ligação. Tente novamente.");
}
};

const handleSignUp = async (e: React.FormEvent) => {
e.preventDefault();
setError(null);
const res = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, metadata: { first_name: firstName, last_name: lastName, role } }),
});
const data = await res.json();
if (!res.ok) setError(data.error ?? "Erro ao registar.");
else { setIsLoginOpen(false); router.push("/dashboard"); }
};

const goToPhase = useCallback((index: number) => {
if (isCooldown.current || isDashboardView) return;
if (!hasInteracted) setHasInteracted(true);
const nextIndex = (index + PROGRAM_PHASES.length) % PROGRAM_PHASES.length;
isCooldown.current = true;
setTimeout(() => { isCooldown.current = false; }, 1000);

setActivePhaseIndex(nextIndex);
const currentFrame = targetFrameValue.get();
const targetFocus = PROGRAM_PHASES[nextIndex].focusFrame;
let diff = targetFocus - (currentFrame % TOTAL_FRAMES_COUNT);
if (diff > TOTAL_FRAMES_COUNT / 2) diff -= TOTAL_FRAMES_COUNT;
if (diff < -TOTAL_FRAMES_COUNT / 2) diff += TOTAL_FRAMES_COUNT;
animate(targetFrameValue, currentFrame + diff, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
}, [isDashboardView, targetFrameValue, activePhaseIndex, hasInteracted]);

useEffect(() => {
const handleWheel = (e: WheelEvent) => {
if (isDashboardView) return;
e.preventDefault();
if (isCooldown.current) return;
scrollIntent.current += e.deltaY;
if (scrollIntent.current > 60) { goToPhase(activePhaseIndex + 1); scrollIntent.current = 0; }
else if (scrollIntent.current < -60) { goToPhase(activePhaseIndex - 1); scrollIntent.current = 0; }
};
const el = containerRef.current;
el?.addEventListener("wheel", handleWheel, { passive: false });
return () => el?.removeEventListener("wheel", handleWheel);
}, [activePhaseIndex, goToPhase, isDashboardView]);

useEffect(() => {
const moveCursor = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
window.addEventListener("mousemove", moveCursor);
return () => window.removeEventListener("mousemove", moveCursor);
}, [mouseX, mouseY]);

const displayAvatarFinal = avatarPreview || (email && authMode === 'login' ? `https://api.dicebear.com/7.x/initials/svg?seed=${email}&backgroundColor=ffffff&textColor=000000` : null);

// --- MAPEAMENTO NARRATIVO VISUAL (Aumento Monumental de Fonte e Contraste) ---
const getDynamicPhaseContent = (index: number) => {
  const base = PROGRAM_PHASES[index];
  const defaultTextClass = "text-xl md:text-2xl font-light text-white leading-loose drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]";

  if (!telemetry) return { ...base, description: <span className={defaultTextClass}>{base.description}</span> };

  switch (index) {
    case 2: // Radar / Capacitação
      return {
        ...base,
        description: (
          <div className="space-y-8">
            <p className={defaultTextClass}>
              Capacitar e valorizar os recursos humanos do sistema educativo angolano. O nosso acompanhamento regista uma eficácia sólida.
            </p>
            {telemetry.media_radar && (
              <div className="flex items-center gap-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl w-fit shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                    <motion.circle 
                      cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="transparent" 
                      strokeDasharray="264" strokeDashoffset={264 - (264 * telemetry.media_radar) / 100} 
                      className="text-blue-500" transition={{ duration: 2, ease: "easeOut" }} 
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-white">{telemetry.media_radar}%</span>
                </div>
                <div className="text-left">
                  <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-blue-400 mb-2 font-bold drop-shadow-md">Média Nacional</p>
                  <p className="text-xl md:text-2xl text-white font-medium">Radar de Integração</p>
                </div>
              </div>
            )}
          </div>
        )
      };
    case 3: // Par Pedagógico
      return {
        ...base,
        rawDescription: true,
        description: (
          <div className="space-y-4 pointer-events-auto">
            <div className="max-w-3xl rounded-[2rem] bg-black/20 px-6 py-5 text-[15px] md:text-[16px] leading-8 text-white/95 tracking-normal shadow-[0_0_35px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-1">Equipa de Formadores</p>
              A promoção da supervisão apoia-se em <strong className="text-blue-400 font-bold">{telemetry.total_formadores || 0} formadores</strong> de excelência.
            </div>
            {telemetry.formadores_lista && <FormadoresLoop formadores={telemetry.formadores_lista} />}
          </div>
        )
      };
    case 4: // Agenda (Impacto Regional)
      return {
        ...base,
        subtitle: telemetry.proximo_evento ? "Próxima Etapa na Agenda" : base.subtitle,
        description: (
          <div className="space-y-8">
            <p className={defaultTextClass}>
              O projecto consolida a sua presença em Luanda e no Bié através de marcos e actividades contínuas focadas na elevação do 2º ciclo.
            </p>
            {telemetry.proximo_evento && telemetry.data_proximo_evento && (
              <div className="flex items-center gap-6 bg-gradient-to-r from-blue-900/40 to-black/60 backdrop-blur-xl p-8 border-l-4 border-blue-500 rounded-r-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] w-fit">
                <Calendar className="text-blue-400 w-14 h-14 shrink-0 drop-shadow-xl" />
                <div className="text-left">
                  <p className="text-sm md:text-base uppercase tracking-[0.3em] text-blue-300 font-bold mb-2 drop-shadow-md">
                    Próxima Acção — {new Date(telemetry.data_proximo_evento).toLocaleDateString('pt-PT')}
                  </p>
                  <p className="text-xl md:text-3xl text-white font-light italic drop-shadow-lg">
                    "{telemetry.proximo_evento}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      };
    case 5: // Cofre de Recursos
      return {
        ...base,
        description: (
          <div className="space-y-8">
            <p className={defaultTextClass}>
              Disponibilizamos ferramentas inovadoras e um acervo didáctico de acesso imediato para elevar o ensino diário nas salas de aula.
            </p>
            {telemetry.total_materiais && (
              <div className="flex items-center gap-8 bg-black/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] w-fit">
                <div className="p-5 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                  <FileText className="text-amber-400 w-12 h-12 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                </div>
                <div className="text-left">
                  <span className="text-5xl md:text-7xl font-extralight text-white tracking-tighter drop-shadow-lg">{telemetry.total_materiais}</span>
                  <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-amber-400 font-bold mt-2 drop-shadow-md">Materiais no Cofre</p>
                </div>
              </div>
            )}
          </div>
        )
      };
    default:
      return { ...base, description: <span className={defaultTextClass}>{base.description}</span> };
  }
};

const activeData = getDynamicPhaseContent(activePhaseIndex);

return (
<div ref={containerRef} className="relative h-[100dvh] w-full bg-transparent overflow-hidden touch-none font-sans md:cursor-none">
{/* CURSOR */}
<motion.div className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[100] mix-blend-difference hidden md:block" style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }} animate={{ scale: isHovering ? 3.5 : 1, opacity: 0.8 }} transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.2 }} />

{/* NOVO: A VINHETA "CINEMASCOPE" PARA PROTECÇÃO DE LEITURA */}
<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent pointer-events-none z-20" />

<AnimatePresence>
{!isDashboardView && (
<motion.div key="hero-main-ui" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }} transition={{ duration: 1 }} className="absolute inset-0 z-30" >

{/* DIALOG DE LOGIN / REGISTER MANTIDO INTACTO */}
<Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
<DialogContent className="sm:max-w-[400px] bg-transparent backdrop-blur-2xl border border-white/5 text-white rounded-none shadow-none md:cursor-default p-8">
<DialogHeader className="mb-2">
<DialogTitle className="flex flex-col items-center justify-center gap-1">
<span className="text-lg font-light uppercase tracking-[0.3em] text-white">Saber Mais</span>
<span className="text-[10px] font-light uppercase tracking-widest text-white/40">{authMode === 'login' ? 'Acesso Restrito' : 'Nova Conta'}</span>
</DialogTitle>
</DialogHeader>

<div className="flex justify-center my-4">
<div className="relative w-20 h-20 rounded-full border border-white/20 flex items-center justify-center overflow-hidden group transition-colors hover:border-white/50 cursor-pointer md:cursor-none" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
{displayAvatarFinal ? <img src={displayAvatarFinal} alt="Perfil" className="w-full h-full object-cover opacity-90" /> : <User size={24} strokeWidth={1} className="text-white/30" />}
<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
<Camera size={16} strokeWidth={1.5} className="text-white mb-1" />
<input type="file" accept="image/*" onChange={(e) => {if(e.target.files?.[0]) setAvatarPreview(URL.createObjectURL(e.target.files[0]))}} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
</div>
</div>
</div>

{authMode === 'login' ? (
<form onSubmit={handleLogin} className="space-y-6">
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 rounded-none border-0 border-b border-white/20 bg-transparent px-0 text-sm text-white focus-visible:ring-0 shadow-none"/></div>
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Passe</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 rounded-none border-0 border-b border-white/20 bg-transparent px-0 text-sm text-white focus-visible:ring-0 shadow-none"/></div>
{error && <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">{error}</p>}
<Button type="submit" className="w-full rounded-none border border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-light uppercase tracking-[0.2em] py-6 shadow-none">Entrar</Button>
</form>
) : (
<form onSubmit={handleSignUp} className="space-y-5">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Nome</Label><Input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Apelido</Label><Input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
</div>
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
<div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Passe</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
<div className="space-y-2">
<Label className="text-[9px] uppercase tracking-widest text-white/40">Função</Label>
<RadioGroup value={role} onValueChange={setRole} className="flex gap-6">
<div className="flex items-center space-x-2"><RadioGroupItem value="formando" id="role-f" className="border-white/30"/><Label htmlFor="role-f" className="text-[10px] text-white/70">Formando</Label></div>
<div className="flex items-center space-x-2"><RadioGroupItem value="formador" id="role-r" className="border-white/30"/><Label htmlFor="role-r" className="text-[10px] text-white/70">Formador</Label></div>
</RadioGroup>
</div>
{error && <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">{error}</p>}
<Button type="submit" className="w-full rounded-none border border-white/20 bg-transparent text-white hover:bg-white hover:text-black font-light uppercase tracking-[0.2em] py-6 shadow-none">Registar</Button>
</form>
)}
<div className="text-center text-[10px] text-white/40 font-light mt-4">
{authMode === 'login' ? (<>Não tem conta? <button onClick={() => setAuthMode('register')} className="font-medium hover:text-white ml-1">Registe-se</button></>) : (<>Já tem conta? <button onClick={() => setAuthMode('login')} className="font-medium hover:text-white ml-1">Entrar</button></>)}
</div>
</DialogContent>
</Dialog>

{/* HEADER FIXO SUPERIOR DIREITO */}
<motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2, ease: "easeOut" }} className="fixed top-12 right-6 sm:right-12 md:right-16 z-50 pointer-events-auto flex justify-end">
{user ? (
<div className="flex flex-col items-end gap-2 group/header">
<div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-500 hover:border-white/30">
<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
<span className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-white whitespace-nowrap">
{user.user_metadata?.first_name || 'Utilizador'}
</span>
</div>
<button onClick={handleLogout} className="text-[8px] uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover/header:opacity-100 flex items-center gap-1 cursor-none">
<LogOut size={10} /> Terminar Sessão
</button>
</div>
) : (
<button onClick={() => setIsLoginOpen(true)} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/[0.08] border border-white/10 hover:border-white/40 transition-all duration-500 cursor-none shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] overflow-hidden">
<LogIn size={14} strokeWidth={1.5} className="relative z-10 text-white/50 group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_16px_rgba(59,130,246,0.55)]" />
<span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-slate-950/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.3em] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-[0_0_18px_rgba(59,130,246,0.35)] ring-1 ring-sky-400/20 group-hover:animate-pulse">Entrar</span>
</button>
)}
<button onClick={() => setHelpOpen(true)} className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/80 transition hover:border-sky-400/40 hover:text-white hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]">
<span className="text-sm font-bold">?</span>
<span className="sr-only">Abrir guia de ajuda</span>
</button>
</motion.header>
<HelpGuide open={helpOpen} setOpen={setHelpOpen} />

{/* RECUO ESTRUTURAL E REDIMENSIONAMENTO GIGANTE: left empurrado para o meio do ecrã e max-w expandido */}
<div className="absolute top-[25%] sm:top-[28%] left-24 sm:left-32 md:left-48 lg:left-[320px] w-[80%] md:max-w-4xl pointer-events-auto z-40">
<AnimatePresence mode="wait">
{activePhaseIndex !== 0 && (
<motion.div key={activePhaseIndex} initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-6 sm:gap-10">
<div className="space-y-4">
<p className="text-[12px] md:text-[14px] uppercase tracking-[0.28em] text-white/95 font-semibold truncate drop-shadow-[0_0_20px_rgba(0,0,0,0.35)]">{activeData.subtitle}</p>
          {/* TÍTULO REESCALADO PARA IMPACTO CINEMATOGRÁFICO */}
          <h1 className="text-6xl sm:text-7xl lg:text-[6rem] font-light uppercase tracking-tighter text-white leading-[0.85] drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">{activeData.name}</h1>
        </div>

        {/* DESCRIÇÃO DA FASE APRIMORADA */}
        <div className="w-full">
          {(activeData as any).rawDescription ? (
            <div>{activeData.description}</div>
          ) : (
            <p className="max-w-3xl rounded-[2rem] bg-black/20 px-6 py-5 text-[15px] md:text-[16px] leading-8 text-white/95 tracking-normal shadow-[0_0_35px_rgba(0,0,0,0.2)] backdrop-blur-sm">
              {activeData.description}
            </p>
          )}
</div>

<button onClick={() => window.open(DASHBOARD_URL, "_blank")} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group flex items-center gap-6 pt-8 cursor-none w-fit"><span className="text-[13px] font-medium uppercase tracking-[0.4em] text-white/95 group-hover:text-white transition-colors drop-shadow-md">Saber Mais</span><div className="relative w-16 h-[1px] bg-white/30 overflow-hidden"><div className="absolute top-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-500 ease-out" /></div></button>
</motion.div>
)}
</AnimatePresence>
</div>

{/* LOGO + TAGLINE BOLD + FÓRMULAS SUPERNOVA */}
<motion.div initial={{ opacity: 0, x: "-50%", y: 50 }} animate={{ opacity: 1, x: "-50%", y: 0 }} transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-10 sm:bottom-12 md:bottom-16 left-1/2 z-50 flex flex-col items-center pointer-events-auto group w-[320px] sm:w-[500px] md:w-[750px]" >
<div className="relative flex flex-col justify-center items-center py-0 cursor-none" onMouseEnter={() => { setIsLogoHovered(true); setIsHovering(true); }} onMouseLeave={() => { setIsLogoHovered(false); setIsHovering(false); }}>
<AnimatePresence>
{/* BLOCO DE LOGIN DO LOGO */}
{isLogoHovered && (
user ? (
<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-20 flex flex-col items-center gap-2 z-50 group/logomenu">
<div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-500">
<div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
<span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white whitespace-nowrap">Sessão: {user.user_metadata?.first_name || 'UTILIZADOR'}</span>
</div>
<button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-[8px] uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors flex items-center gap-1 opacity-0 group-hover/logomenu:opacity-100 cursor-none"><LogOut size={10} /> Terminar Sessão</button>
</motion.div>
) : (
<motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={(e) => { e.stopPropagation(); setIsLoginOpen(true); }} className="absolute -top-12 group inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/[0.08] backdrop-blur-3xl border border-white/10 hover:border-white/40 transition-all duration-500 z-50 pointer-events-auto cursor-none shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] overflow-hidden">
  <LogIn size={14} strokeWidth={1.5} className="relative z-10 text-white/50 group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_16px_rgba(59,130,246,0.55)]" />
  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-slate-950/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.35em] text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-[0_0_18px_rgba(59,130,246,0.35)] ring-1 ring-sky-400/20 group-hover:animate-pulse">Entrar</span>
</motion.button>
)
)}

{/* ANIMAÇÃO 'SUPERNOVA' EXPANSIVA DE FÓRMULAS */}
{isLogoHovered && EDUCATIONAL_ELEMENTS.map((item, i) => {
const angle = (i * 360 / EDUCATIONAL_ELEMENTS.length) * (Math.PI / 180);
const maxRadius = 350 + (i % 3) * 60;
return (
<motion.div key={i} initial={{ x: 0, y: 0, opacity: 0, scale: 0.1 }} animate={{ x: [0, Math.cos(angle) * maxRadius], y: [0, Math.sin(angle) * maxRadius], opacity: [0, 1, 0.8, 0], scale: [0.5, 1.5, 2.5] }} transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeOut", delay: (i % 6) * 0.3 }} className="absolute text-white/70 font-mono italic text-[11px] pointer-events-none mix-blend-screen whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
{item}
</motion.div>
);
})}
</AnimatePresence>
<motion.div onClick={() => goToPhase(0)} className="relative z-10 flex justify-center items-center" animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
<img src="/storage/v1/object/public/Logo%20Sabermais/Sabermais_Logo.png" alt="Logotipo" className="relative h-28 sm:h-40 md:h-52 w-auto object-contain transition-transform duration-1000 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
</motion.div>
</div>
<p className="text-[5.5px] sm:text-[7px] md:text-[7.5px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.6em] md:tracking-[0.85em] text-white/70 text-center leading-none mt-0.5 z-20 whitespace-nowrap w-full drop-shadow-md">Programa de Apoio ao Reforço do Ensino Secundário em Angola</p>
</motion.div>

{/* CLUSTER DIREITO: SIDEBAR + NAVEGADOR INDEPENDENTE (RELÓGIO) */}
<div className="fixed right-6 sm:right-12 md:right-16 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6 sm:gap-10">
<PhasesSidebar activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} phases={PROGRAM_PHASES} setIsHovering={setIsHovering} />
<Navigator activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} setIsHovering={setIsHovering} />
</div>

<HeroBranding />

</motion.div>
)}
</AnimatePresence>
</div>
);
}