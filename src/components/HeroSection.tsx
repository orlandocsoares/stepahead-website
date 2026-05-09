"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, AnimatePresence, animate } from "framer-motion";
import { LogIn, LogOut, User, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DASHBOARD_URL } from "@/lib/program-config";

// IMPORTS EXTERNOS
import { PhasesSidebar } from "./PhasesSidebar";
import { Navigator } from "./Navigator";

const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;

// ARRAY EXPANDIDO PARA MAIOR VARIEDADE E MENOS REPETIÇÃO
const EDUCATIONAL_ELEMENTS = [
"E = mc²", "H₂O", "∫ f(x) dx", "F = ma", "πr²", "CO₂", "Ser / Estar",
"x² + y² = z²", "∑", "NaCl", "v = d/t", "A, E, I, O, U", "∞",
"Δp ≥ ℏ/2", "O₂", "Sujeito + Verbo", "C₆H₁₂O₆", "a² + b² = c²",
"H₂SO₄", "lim(x→∞)", "V = R·I", "log(x)", "sin²θ + cos²θ = 1", "√x",
"∇ × E = -∂B/∂t", "i² = -1", "F = G(m₁m₂)/r²", "e^(iπ) + 1 = 0",
"λ = h/p", "PV = nRT", "C = 2πr", "S = k log W"
];

const PROGRAM_PHASES = [
{ id: "fase-0", focusFrame: 8, subtitle: "Acesso à Plataforma", name: "Login", description: "Aceda à área reservada para professores e agentes educativos. Faça login para explorar os módulos, materiais didáticos e progresso." },
{ id: "fase-1", focusFrame: 39, subtitle: "III Ciclo - Angola", name: "Saber Mais", description: "Programa de Cooperação Bilateral entre Portugal e Angola, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola-INFQE." },
{ id: "fase-2", focusFrame: 66, subtitle: "Objetivo Geral", name: "Capacitação", description: "Capacitar e valorizar os recursos humanos do sistema educativo angolano, priorizando os agentes do Ensino Secundário Pedagógico." },
{ id: "fase-3", focusFrame: 86, subtitle: "Modelo de Supervisão", name: "Par Pedagógico", description: "Promoção da supervisão em modelo de par pedagógico e a institucionalização de Centros de Recursos nas comunidades." },
{ id: "fase-4", focusFrame: 151, subtitle: "Impacto Regional", name: "Luanda & Bié", description: "O programa está presente em duas províncias chave: Bié e Luanda, com foco na elevação da qualidade do ensino no 2º ciclo." },
{ id: "fase-5", focusFrame: 210, subtitle: "Apoio Contínuo", name: "Recursos", description: "Disponibilização de materiais pedagógicos inovadores e guias práticos para apoiar os professores nas salas de aula diariamente." },
{ id: "fase-6", focusFrame: 260, subtitle: "Avaliação de Impacto", name: "Monitorização", description: "Acompanhamento rigoroso dos indicadores de sucesso para garantir a eficácia e a sustentabilidade do programa a longo prazo." }
];

interface HeroSectionProps {
isDashboardView?: boolean;
}

export function HeroSection({ isDashboardView = false }: HeroSectionProps) {
const containerRef = useRef<HTMLDivElement>(null);
const router = useRouter();

// ESTADOS
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

const mouseX = useMotionValue(-100);
const mouseY = useMotionValue(-100);
const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
const isCooldown = useRef(false);
const scrollIntent = useRef(0);

// --- BLOCO DE INTEGRAÇÃO SUPABASE (ATUALIZADO) ---
useEffect(() => {
  // Verificação inicial do usuário com log de diagnóstico
  supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.log("Supabase Connection: Erro ao buscar usuário", error);
    } else {
      console.log("Supabase Connection: OK", data.user);
      setUser(data.user);
    }
  });

  // Listener em tempo real para mudanças de sessão
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    console.log("Auth State Change:", _event, session?.user?.email);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);

const handleLogout = async () => { await supabase.auth.signOut(); router.refresh(); };

const handleLogin = async (e: React.FormEvent) => {
e.preventDefault();
setError(null);
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setError(error.message);
else { setIsLoginOpen(false); router.push("/dashboard"); }
};

const handleSignUp = async (e: React.FormEvent) => {
e.preventDefault();
setError(null);
const { error } = await supabase.auth.signUp({
email, password, options: { data: { first_name: firstName, last_name: lastName, role: role } },
});
if (error) setError(error.message);
else { setIsLoginOpen(false); router.push("/dashboard"); }
};

// NAVEGAÇÃO ENTRE FASES
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

// EVENTOS DE SCROLL E CANVAS
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

return (
<div ref={containerRef} className="relative h-screen w-full bg-transparent overflow-hidden touch-none font-sans md:cursor-none">
{/* CURSOR */}
<motion.div className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[100] mix-blend-difference hidden md:block" style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }} animate={{ scale: isHovering ? 3.5 : 1, opacity: 0.8 }} transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.2 }} />

<AnimatePresence>
{!isDashboardView && (
<motion.div key="hero-main-ui" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }} transition={{ duration: 1 }} className="absolute inset-0 z-30" >
{/* DIALOG DE LOGIN / REGISTER */}
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
<button onClick={() => setIsLoginOpen(true)} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group relative flex items-center gap-2 px-6 py-2.5 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl hover:border-white/40 transition-all duration-500 cursor-none shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
<LogIn size={14} strokeWidth={1.5} className="text-white/50 group-hover:text-white transition-colors" />
<span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 group-hover:text-white transition-colors">Entrar</span>
</button>
)}
</motion.header>

{/* TEXTOS FASES (ESQUERDA) */}
<div className="absolute top-1/3 left-6 sm:left-12 md:left-24 lg:left-40 w-[75%] sm:w-[80%] md:max-w-xl pointer-events-auto z-40">
<AnimatePresence mode="wait">
{activePhaseIndex !== 0 && (
<motion.div key={activePhaseIndex} initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(10px)" }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-6 sm:gap-8">
<div className="space-y-2">
<p className="text-[9px] tracking-[0.6em] text-white/50 uppercase font-medium truncate">{PROGRAM_PHASES[activePhaseIndex].subtitle}</p>
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-light uppercase tracking-tight text-white leading-[0.9]">{PROGRAM_PHASES[activePhaseIndex].name}</h1>
</div>
<p className="text-sm text-white/60 leading-relaxed font-light max-w-sm">{PROGRAM_PHASES[activePhaseIndex].description}</p>
<button onClick={() => window.open(DASHBOARD_URL, "_blank")} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group flex items-center gap-4 pt-4 cursor-none w-fit"><span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">Saber Mais</span><div className="relative w-8 h-[1px] bg-white/20 overflow-hidden"><div className="absolute top-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-500 ease-out" /></div></button>
</motion.div>
)}
</AnimatePresence>
</div>

{/* LOGO + TAGLINE BOLD + FÓRMULAS SUPERNOVA */}
<motion.div initial={{ opacity: 0, x: "-50%", y: 50 }} animate={{ opacity: 1, x: "-50%", y: 0 }} transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-6 md:bottom-12 left-1/2 z-50 flex flex-col items-center pointer-events-auto group w-[320px] sm:w-[500px] md:w-[750px]" >
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
<motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={(e) => { e.stopPropagation(); setIsLoginOpen(true); }} className="absolute -top-12 group flex items-center gap-2 px-5 py-2 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl hover:border-white/40 transition-all duration-500 z-50 pointer-events-auto cursor-none shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
<LogIn size={14} strokeWidth={1.5} className="text-white/50 group-hover:text-white transition-colors" />
<span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/70 group-hover:text-white transition-colors">Entrar</span>
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
<img src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/Sabermais_Logo.png" alt="Logotipo" className="relative h-28 sm:h-40 md:h-52 w-auto object-contain transition-transform duration-1000 group-hover:scale-105" />
</motion.div>
</div>
<p className="text-[5.5px] sm:text-[7px] md:text-[7.5px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.6em] md:tracking-[0.85em] text-white/50 text-center leading-none mt-0.5 z-20 whitespace-nowrap w-full">Programa de Apoio ao Reforço do Ensino Secundário em Angola</p>
</motion.div>

{/* CLUSTER DIREITO: SIDEBAR + NAVEGADOR INDEPENDENTE (RELÓGIO) */}
<div className="fixed right-6 sm:right-12 md:right-16 bottom-[35vh] z-50 flex flex-col items-end gap-10">
<PhasesSidebar activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} phases={PROGRAM_PHASES} setIsHovering={setIsHovering} />
<Navigator activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} setIsHovering={setIsHovering} />
</div>

</motion.div>
)}
</AnimatePresence>
</div>
);
}
