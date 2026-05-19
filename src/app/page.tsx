"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, AnimatePresence, animate } from "framer-motion";
import { LogIn, User, Camera, GraduationCap, UserCheck, Calendar, FileText, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DASHBOARD_URL } from "@/lib/program-config";
import { PhasesSidebar } from "@/components/PhasesSidebar"; 
import { Navigator } from "@/components/Navigator";
import { CommandCenter } from "@/components/CommandCenter";
import { HeroBranding } from "@/components/HeroBranding";

const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
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
  { id: "fase-5", focusFrame: 210, subtitle: "Apoio Contínuo", name: "Recursos", description: "Disponibilização de materiais pedagógicos inovadores e guias práticos para apoiar os professores nas salas diárias." },
  { id: "fase-6", focusFrame: 260, subtitle: "Avaliação de Impacto", name: "Monitorização", description: "Acompanhamento rigoroso dos indicadores de sucesso para garantir a eficácia e a sustentabilidade do projecto a longo prazo." }
];

const SIMULATED_FORMADORES = [
  { first_name: "Ana", last_name: "Kiala", especialidade: "Matemática e Física", biografia: "Especialista em metodologias de ensino activo para ciências exactas no II Ciclo.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnaKiala&backgroundColor=b6e3f4" },
  { first_name: "Carlos", last_name: "Mendes", especialidade: "Língua Portuguesa", biografia: "Mestre em linguística aplicada, focado na capacitação de leitura e interpretação textual.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosMendes&backgroundColor=c0aede" },
  { first_name: "Fátima", last_name: "Dumbumba", especialidade: "Biologia e Química", biografia: "Investigadora em didáctica das ciências, promovendo laboratórios práticos locais.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=FatimaD&backgroundColor=ffdfbf" }
];

function FormadoresLoop({ formadores }: { formadores: any[] }) {
  const [idx, setIdx] = useState(0);
  const data = formadores && formadores.length > 0 ? formadores : SIMULATED_FORMADORES;
  
  useEffect(() => {
    if (!data || data.length <= 1) return;
    const interval = setInterval(() => setIdx(p => (p + 1) % data.length), 5500);
    return () => clearInterval(interval);
  }, [data]);

  if (!data || data.length === 0) return null;
  const f = data[idx];
  const avatar = f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${f.first_name}&backgroundColor=ffffff&textColor=000000`;

  return (
    <div className="relative overflow-hidden w-full h-[80px] mt-3 bg-transparent">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex items-center gap-4 w-full absolute inset-0"
        >
          <img src={avatar} className="w-14 h-14 rounded-full border border-white/20 object-cover shrink-0 drop-shadow-md" alt="Formador" />
          <div className="flex flex-col text-left">
            <span className="text-xl text-white font-bold tracking-tight drop-shadow-md">{f.first_name} {f.last_name}</span>
            <span className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold mt-0.5 drop-shadow-sm">{f.especialidade || 'Área Pedagógica'}</span>
            <p className="text-[11px] text-white/80 mt-1 font-light leading-snug line-clamp-2 drop-shadow-sm">{f.biografia || 'Reforço das metodologias de ensino activo.'}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function HeroSection({ isDashboardView = false }: { isDashboardView?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVIPWelcomeOpen, setIsVIPWelcomeOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [userRole, setUserRole] = useState<'formando' | 'formador'>('formando');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [provincia, setProvincia] = useState('');
  const [escola, setEscola] = useState('');       
  const [especialidade, setEspecialidade] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const [telemetry, setTelemetry] = useState<any>(null);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
  const isCooldown = useRef(false);
  const scrollIntent = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfileData(data));
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfileData(data);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTelemetry = async () => {
      if (isDashboardView) return;
      const { data: telData } = await supabase.from('hero_telemetria').select('*').single();
      const { data: formadoresData } = await supabase.from('profiles').select('*').eq('role', 'formador').limit(4);
      if (telData) {
        setTelemetry({ ...telData, formadores_lista: formadoresData || [] });
      }
    };
    fetchTelemetry();
  }, [isDashboardView]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const triggerVIPTransition = async () => {
    setIsLoginOpen(false);
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      const { data } = await supabase.from("profiles").select("*").eq("id", freshUser.id).single();
      setProfileData(data);
    }
    setIsVIPWelcomeOpen(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 3200); 
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { await triggerVIPTransition(); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const metadata = {
      first_name: firstName,
      last_name: lastName,
      role: userRole,
      ...(userRole === 'formando' ? { provincia, escola } : { especialidade })
    };
    const { error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (error) setError(error.message);
    else { await triggerVIPTransition(); }
  };

  const goToPhase = useCallback((index: number) => {
    if (isCooldown.current || isDashboardView) return;
    if (!hasInteracted) setHasInteracted(true);
    const nextIndex = (index + PROGRAM_PHASES.length) % PROGRAM_PHASES.length;
    isCooldown.current = true;
    setTimeout(() => { isCooldown.current = false; }, 1200); 

    setActivePhaseIndex(nextIndex);
    const currentFrame = targetFrameValue.get();
    const targetFocus = PROGRAM_PHASES[nextIndex].focusFrame;
    let diff = targetFocus - (currentFrame % TOTAL_FRAMES_COUNT);
    if (diff > TOTAL_FRAMES_COUNT / 2) diff -= TOTAL_FRAMES_COUNT;
    if (diff < -TOTAL_FRAMES_COUNT / 2) diff += TOTAL_FRAMES_COUNT;
    animate(targetFrameValue, currentFrame + diff, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
  }, [isDashboardView, targetFrameValue, hasInteracted]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isDashboardView) return;
      e.preventDefault();
      if (isCooldown.current) return;
      scrollIntent.current += e.deltaY;
      if (scrollIntent.current > 70) { goToPhase(activePhaseIndex + 1); scrollIntent.current = 0; } 
      else if (scrollIntent.current < -70) { goToPhase(activePhaseIndex - 1); scrollIntent.current = 0; }
    };
    const el = containerRef.current;
    el?.addEventListener("wheel", handleWheel, { passive: false });
    return () => el?.removeEventListener("wheel", handleWheel);
  }, [activePhaseIndex, goToPhase, isDashboardView]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = (img: HTMLImageElement) => {
      const cw = window.innerWidth, ch = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = cw * dpr; canvas.height = ch * dpr; ctx.scale(dpr, dpr);
      const imgRatio = img.naturalWidth / img.naturalHeight, canvasRatio = cw / ch;

      let rW, rH, oX, oY;
      if (canvasRatio > imgRatio) { rW = cw; rH = cw / imgRatio; oX = 0; oY = (ch - rH) / 2; } 
      else { rW = ch * imgRatio; rH = ch; oX = (cw - rW) / 2; oY = 0; }
      ctx.drawImage(img, oX, oY, rW, rH);
    };

    window.addEventListener("resize", () => {
      let f = Math.round(targetFrameValue.get()) % TOTAL_FRAMES_COUNT;
      if (f < 0) f += TOTAL_FRAMES_COUNT;
      const img = imagesRef.current[f];
      if (img?.complete) draw(img);
    });

    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      img.src = `${BASE_FRAME_URL}frame_${i.toString().padStart(3, "0")}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      if (i === 0) img.onload = () => draw(img);
    }

    const unsubscribe = targetFrameValue.on("change", (v) => {
      let frameIdx = Math.round(v) % TOTAL_FRAMES_COUNT;
      if (frameIdx < 0) frameIdx += TOTAL_FRAMES_COUNT;
      const img = imagesRef.current[frameIdx];
      if (img?.complete) draw(img);
    });
    return () => { unsubscribe(); };
  }, [targetFrameValue]);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [mouseX, mouseY]);

  const displayAvatarFinal = avatarPreview || (email && authMode === 'login' ? `https://api.dicebear.com/7.x/initials/svg?seed=${email}&backgroundColor=ffffff&textColor=000000` : null);
  const finalFullName = authMode === 'login' 
    ? `${profileData?.first_name || ""} ${profileData?.last_name || ""}`.trim() || email
    : `${firstName} ${lastName}`.trim();

  const getDynamicPhaseContent = (index: number) => {
    const base = PROGRAM_PHASES[index];
    const defaultTextClass = "text-[13px] font-bold text-white/95 leading-snug drop-shadow-md";

    if (!telemetry) return { ...base, description: <span className={defaultTextClass}>{base.description}</span> };

    switch (index) {
      case 2:
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>{base.description}</p>
              {telemetry.media_radar && (
                <div className="flex items-center gap-4 mt-3 w-fit">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                      <motion.circle 
                        cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="transparent" 
                        strokeDasharray="150" strokeDashoffset={150 - (150 * telemetry.media_radar) / 100} 
                        className="text-blue-500" transition={{ duration: 2 }} 
                      />
                    </svg>
                    <span className="absolute text-sm font-bold text-white">{telemetry.media_radar}%</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-blue-300 font-bold">Média Nacional</p>
                    <p className="text-[15px] text-white font-bold">Radar de Integração</p>
                  </div>
                </div>
              )}
            </div>
          )
        };
      case 3:
        return {
          ...base,
          description: (
            <div className="space-y-2">
              <p className={defaultTextClass}>A promoção da supervisão apoia-se em <strong className="text-blue-300">{telemetry.total_formadores || 3} formadores</strong> de excelência.</p>
              <FormadoresLoop formadores={telemetry.formadores_lista} />
            </div>
          )
        };
      case 4:
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>{base.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Calendar className="text-blue-400 w-10 h-10" />
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300 font-bold">Próxima Acção</p>
                  <p className="text-[15px] text-white font-bold italic">{telemetry.proximo_evento || 'Agendada'}</p>
                </div>
              </div>
            </div>
          )
        };
      case 5:
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>{base.description}</p>
              {telemetry.total_materials && (
                <div className="flex items-center gap-4 mt-3">
                  <FileText className="text-amber-400 w-10 h-10" />
                  <div className="text-left">
                    <span className="text-4xl font-bold text-white tracking-tighter">{telemetry.total_materials}</span>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-amber-400 font-bold">Materiais no Cofre</p>
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
    <div ref={containerRef} className="relative h-screen w-full bg-black overflow-hidden touch-none font-sans md:cursor-none selection:bg-blue-500/30">
      
      {!isDashboardView && user && !isVIPWelcomeOpen && <CommandCenter />}

      <motion.div className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[100] mix-blend-difference hidden md:block" style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }} animate={{ scale: isHovering ? 3.5 : 1, opacity: 0.8 }} transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.2 }} />

      <div className="absolute inset-0 z-10">
        <canvas ref={canvasRef} className="w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>

      <AnimatePresence>
        {!isDashboardView && (
          <motion.div key="hero-main-ui" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }} className="absolute inset-0 z-30 pointer-events-none" >
            
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogContent className="w-[95vw] sm:max-w-[440px] bg-black/10 backdrop-blur-3xl border border-white/5 text-white rounded-[2.5rem] p-10 pointer-events-auto z-[200]">
                <AnimatePresence mode="wait">
                  <motion.div key={authMode} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="w-full flex flex-col">
                    <DialogHeader className="mb-6 text-center">
                      <DialogTitle className="flex flex-col items-center gap-1">
                        <span className="text-xl font-light uppercase tracking-[0.3em] italic">Portal Saber Mais</span>
                        <span className="text-[10px] font-light uppercase tracking-widest text-white/40">
                          {authMode === 'login' ? 'Acesso Restrito' : 'Categorização de Utilizador'}
                        </span>
                      </DialogTitle>
                    </DialogHeader>

                    {authMode === 'register' && (
                      <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
                        <button type="button" onClick={() => setUserRole('formando')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${userRole === 'formando' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                          <GraduationCap size={14} /> Formando
                        </button>
                        <button type="button" onClick={() => setUserRole('formador')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${userRole === 'formador' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
                          <UserCheck size={14} /> Formador
                        </button>
                      </div>
                    )}

                    <div className="flex justify-center my-4">
                      <div className="relative w-20 h-20 rounded-full border border-white/10 flex items-center justify-center overflow-hidden group cursor-pointer" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
                        {displayAvatarFinal ? <img src={displayAvatarFinal} alt="Perfil" className="w-full h-full object-cover" /> : <User size={24} className="text-white/30" />}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                          <Camera size={16} className="text-white mb-1" />
                          <input type="file" accept="image/*" onChange={(e) => {if(e.target.files?.[0]) setAvatarPreview(URL.createObjectURL(e.target.files[0]))}} className="absolute inset-0 w-full h-full opacity-0" />
                        </div>
                      </div>
                    </div>

                    {authMode === 'login' ? (
                      <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-none border-0 border-b border-white/20 bg-transparent px-0 focus-visible:ring-0 shadow-none"/></div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Passe</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-none border-0 border-b border-white/20 bg-transparent px-0 focus-visible:ring-0 shadow-none"/></div>
                        {error && <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">{error}</p>}
                        <Button type="submit" className="w-full rounded-2xl border bg-white/5 hover:bg-white hover:text-black font-medium uppercase tracking-[0.3em] py-6 text-[11px] shadow-none mt-4 transition-all">Entrar</Button>
                      </form>
                    ) : (
                      <form onSubmit={handleSignUp} className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Nome</Label><Input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                          <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Apelido</Label><Input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                        </div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                        <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">Passe</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                        {userRole === 'formando' ? (
                          <div className="space-y-4">
                            <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-blue-400">Província</Label><Input placeholder="Ex: Bié" required value={provincia} onChange={(e) => setProvincia(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                            <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-blue-400">Instituição</Label><Input placeholder="Nome da Escola" required value={escola} onChange={(e) => setEscola(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-emerald-400">Especialidade</Label><Input placeholder="Ex: Supervisão Pedagógica" required value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0"/></div>
                          </div>
                        )}
                        {error && <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">{error}</p>}
                        <Button type="submit" className="w-full rounded-xl border border-white/20 bg-white/5 hover:bg-white hover:text-black font-light uppercase tracking-[0.2em] py-6 shadow-none mt-4 transition-all">Finalizar Inscrição</Button>
                      </form>
                    )}
                    <div className="text-center text-[10px] text-white/40 mt-6">
                      {authMode === 'login' ? (<>Não tem conta? <button type="button" onClick={() => setAuthMode('register')} className="font-medium hover:text-white ml-1 bg-transparent">Registe-se</button></>) : (<>Já tem conta? <button type="button" onClick={() => setAuthMode('login')} className="font-medium hover:text-white ml-1 bg-transparent">Entrar</button></>)}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </DialogContent>
            </Dialog>

            {/* RECTÂNGULO BRANCO - COTA DE CONTENÇÃO ABSOLUTA E RIGOROSA */}
            <div className="absolute top-[28vh] left-8 sm:left-24 lg:left-[160px] w-[85%] md:w-[540px] h-[320px] z-40 pointer-events-auto flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activePhaseIndex !== 0 && (
                  <motion.div key={activePhaseIndex} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} className="relative flex flex-col w-full h-full">
                    <div className="shrink-0">
                      <p className="text-[10px] md:text-[11px] tracking-[0.6em] text-white/70 uppercase font-medium truncate drop-shadow-md">{activeData.subtitle}</p>
                      <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-tight text-white mt-2 drop-shadow-lg">{activeData.name}</h1>
                    </div>
                    <div className="flex-1 mt-4">{activeData.description}</div>
                    <div className="shrink-0 pt-2 mt-auto">
                      <button onClick={() => window.open(DASHBOARD_URL, "_blank")} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group flex items-center gap-4 w-fit outline-none">
                        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80 group-hover:text-white transition-colors">Saber Mais</span>
                        <div className="relative w-12 h-[1px] bg-white/30 overflow-hidden"><div className="absolute top-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-500 ease-out" /></div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* LOGÓTIPO CENTRAL - INTEGRADO E EM CAMADA MÁXIMA DE FLUXO DE LOGIN */}
            <motion.div initial={{ opacity: 0, x: "-50%", y: 50 }} animate={{ opacity: 1, x: "-50%", y: 0 }} transition={{ duration: 1.5, delay: 0.5 }} className="absolute bottom-6 md:bottom-12 left-1/2 z-50 flex flex-col items-center group w-full max-w-[90vw] md:max-w-[750px] pointer-events-auto" >
              <div className="relative flex flex-col justify-center items-center py-0 cursor-none" onMouseEnter={() => { setIsLogoHovered(true); setIsHovering(true); }} onMouseLeave={() => { setIsLogoHovered(false); setIsHovering(false); }}>
                
                <AnimatePresence>
                  {/* FEEDBACK DE ACÇÃO DIRECTO SOBRE O LOGO */}
                  {isLogoHovered && (
                    user ? (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-20 flex flex-col items-center gap-2 z-50 pointer-events-auto">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl shadow-xl transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">Sessão: {user.user_metadata?.first_name || 'Utilizador'}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-[8px] uppercase tracking-widest text-white/40 hover:text-red-400 flex items-center gap-1 cursor-pointer"><LogOut size={10} /> Terminar Sessão</button>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-14 flex flex-col items-center gap-1 z-50 pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 drop-shadow-md">Clique para Entrar</span>
                        <div className="w-6 h-[1px] bg-blue-500/50" />
                      </motion.div>
                    )
                  )}

                  {isLogoHovered && EDUCATIONAL_ELEMENTS.map((item, i) => {
                    const angle = (i * 360 / EDUCATIONAL_ELEMENTS.length) * (Math.PI / 180);
                    const maxRadius = window.innerWidth < 768 ? 160 : 350; 
                    return (
                      <motion.div key={i} initial={{ x: 0, y: 0, opacity: 0, scale: 0.1 }} animate={{ x: Math.cos(angle) * maxRadius, y: Math.sin(angle) * maxRadius, opacity: [0, 1, 0.8, 0], scale: [0.5, 1.5, 2.5] }} transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeOut", delay: (i % 6) * 0.3 }} className="absolute text-white/70 font-mono italic text-[8px] md:text-[11px] pointer-events-none mix-blend-screen whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" >{item}</motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* EVENTO DE CLIQUE TRANSFERIDO DIRECTAMENTE PARA O LOGO */}
                <motion.div 
                  onClick={() => {
                    if (!user) {
                      setIsLoginOpen(true);
                    } else {
                      router.push("/dashboard");
                    }
                  }} 
                  className="relative z-10 flex justify-center items-center flex-col animate-float outline-none cursor-pointer pointer-events-auto" 
                  animate={{ y: [0, -4, 0] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/Sabermais_Logo.png" alt="Logotipo Saber Mais" className="relative h-28 sm:h-40 md:h-52 w-auto object-contain transition-transform duration-1000 group-hover:scale-105 pointer-events-auto mix-blend-screen contrast-125 brightness-110" />
                </motion.div>
              </div>
              <p className="text-[5.5px] sm:text-[7px] md:text-[7.5px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.6em] md:tracking-[0.85em] text-white/70 text-center leading-none mt-4 z-20 whitespace-nowrap w-full drop-shadow-md">
                Programa de Apoio ao Reforço do Ensino Secundário em Angola
              </p>
            </motion.div>

            <div className="fixed right-6 sm:right-16 bottom-[10vh] sm:bottom-[30vh] z-50 flex flex-col items-end gap-10 pointer-events-auto">
              <PhasesSidebar activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} phases={PROGRAM_PHASES} setIsHovering={setIsHovering} />
              <Navigator activePhaseIndex={activePhaseIndex} goToPhase={goToPhase} setIsHovering={setIsHovering} />
            </div>

            <HeroBranding />

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVIPWelcomeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[300] flex flex-col items-center justify-center text-center p-6 pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.99, filter: "blur(15px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
              <motion.img src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/Sabermais_Logo.png" alt="Saber Mais" animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className="h-16 w-auto object-contain mb-8 filter brightness-110 select-none mix-blend-screen" />
              <h2 className="text-5xl font-extralight uppercase tracking-tighter text-white italic leading-none">Bem-vindo</h2>
              <h3 className="text-3xl font-bold uppercase tracking-tight text-blue-500 mt-3 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">{finalFullName}</h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}