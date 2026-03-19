"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { DASHBOARD_URL } from "@/lib/program-config";
import { motion, useMotionValue, AnimatePresence, animate } from "framer-motion";
import { ChevronUp, ChevronDown, Mouse } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


const BASE_FRAME_URL = "https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Nuvem%20LooP/";
const FRAME_SUFFIX = "_delay-0.033s.webp";
const TOTAL_FRAMES_COUNT = 280;

const PROGRAM_PHASES = [
  {
    id: "fase-0",
    focusFrame: 8,
    subtitle: "Acesso à Plataforma",
    name: "Login / Entrar",
    description: "Aceda à área reservada para professores e agentes educativos. Faça login para explorar os módulos, materiais didáticos e progresso."
  },
  {
    id: "fase-1",
    focusFrame: 39,
    subtitle: "III Ciclo - Angola",
    name: "Saber Mais",
    description: "Programa de Cooperação Bilateral entre Portugal e Angola, tutelado pelo Camões, I.P. e pelo Ministério da Educação de Angola-INFQE."
  },
  {
    id: "fase-2",
    focusFrame: 66,
    subtitle: "Objetivo Geral",
    name: "Capacitação",
    description: "Capacitar e valorizar os recursos humanos do sistema educativo angolano, priorizando os agentes do Ensino Secundário Pedagógico."
  },
  {
    id: "fase-3",
    focusFrame: 86,
    subtitle: "Modelo de Supervisão",
    name: "Par Pedagógico",
    description: "Promoção da supervisão em modelo de par pedagógico e a institucionalização de Centros de Recursos nas comunidades."
  },
  {
    id: "fase-4",
    focusFrame: 151,
    subtitle: "Impacto Regional",
    name: "Luanda & Bié",
    description: "O programa está presente em duas províncias chave: Bié e Luanda, com foco na elevação da qualidade do ensino no 2º ciclo."
  },
  {
    id: "fase-5",
    focusFrame: 210,
    subtitle: "Apoio Contínuo",
    name: "Recursos Didáticos",
    description: "Disponibilização de materiais pedagógicos inovadores e guias práticos para apoiar os professores nas salas de aula diariamente."
  },
  {
    id: "fase-6",
    focusFrame: 260,
    subtitle: "Avaliação de Impacto",
    name: "Monitorização",
    description: "Acompanhamento rigoroso dos indicadores de sucesso para garantir a eficácia e a sustentabilidade do programa a longo prazo."
  }
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('formando');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setIsLoginOpen(false);
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      // TODO: Add a success message, e.g. "Check your email to confirm your account"
      setIsLoginOpen(false);
      router.refresh();
    }
  };
  
  // Reset form when dialog opens or mode changes
  useEffect(() => {
    if (isLoginOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setRole('formando');
    } else {
       // Reset to login mode when dialog is closed
      setAuthMode('login');
    }
  }, [isLoginOpen]);

  // Reset form when authMode changes
  useEffect(() => {
      setError(null);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setRole('formando');
  }, [authMode]);


  const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
  const progressBarHeight = useMotionValue("0%");

  const isCooldown = useRef(false);
  const scrollIntent = useRef(0);

  const goToPhase = useCallback((index: number) => {
    if (isCooldown.current) return;
    if (!hasInteracted) setHasInteracted(true);

    const nextIndex = (index + PROGRAM_PHASES.length) % PROGRAM_PHASES.length;

    isCooldown.current = true;
    setTimeout(() => { isCooldown.current = false; }, 3000);

    setActivePhaseIndex(nextIndex);

    const currentFrame = targetFrameValue.get();
    const targetFocus = PROGRAM_PHASES[nextIndex].focusFrame;

    let diff = targetFocus - (currentFrame % TOTAL_FRAMES_COUNT);
    if (diff > TOTAL_FRAMES_COUNT / 2) diff -= TOTAL_FRAMES_COUNT;
    if (diff < -TOTAL_FRAMES_COUNT / 2) diff += TOTAL_FRAMES_COUNT;

    animate(targetFrameValue, currentFrame + diff, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });

    animate(progressBarHeight, `${(nextIndex / (PROGRAM_PHASES.length - 1)) * 100}%`, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
    });

  }, [activePhaseIndex, hasInteracted, targetFrameValue, progressBarHeight]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isCooldown.current) return;

      scrollIntent.current += e.deltaY;

      if (scrollIntent.current > 100) {
        goToPhase(activePhaseIndex + 1);
        scrollIntent.current = 0;
      } else if (scrollIntent.current < -100) {
        goToPhase(activePhaseIndex - 1);
        scrollIntent.current = 0;
      }
    };

    const el = containerRef.current;
    el?.addEventListener("wheel", handleWheel, { passive: false });
    return () => el?.removeEventListener("wheel", handleWheel);
  }, [activePhaseIndex, goToPhase]);

  // CANVAS RESPONSIVO
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = (img: HTMLImageElement) => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = cw / ch;
      let rW, rH, oX, oY;

      if (canvasRatio > imgRatio) {
        rW = cw; rH = cw / imgRatio; oX = 0; oY = (ch - rH) / 2;
      } else {
        rW = ch * imgRatio; rH = ch; oX = (cw - rW) / 2; oY = 0;
      }
      ctx.drawImage(img, oX, oY, rW, rH);
    };

    // Recalcula o canvas quando se vira o telemóvel ou redimensiona a janela
    const handleResize = () => {
      let f = Math.round(targetFrameValue.get()) % TOTAL_FRAMES_COUNT;
      if (f < 0) f += TOTAL_FRAMES_COUNT;
      const img = imagesRef.current[f];
      if (img?.complete && img.naturalHeight > 0) draw(img);
    };
    window.addEventListener("resize", handleResize);

    for (let i = 0; i < TOTAL_FRAMES_COUNT; i++) {
      const img = new Image();
      img.src = `${BASE_FRAME_URL}frame_${i.toString().padStart(3, "0")}${FRAME_SUFFIX}`;
      imagesRef.current[i] = img;
      if (i === 0) img.onload = () => draw(img);
    }

    let lastFrame = -1;
    const unsubscribe = targetFrameValue.on("change", (v) => {
      let frameIdx = Math.round(v) % TOTAL_FRAMES_COUNT;
      if (frameIdx < 0) frameIdx += TOTAL_FRAMES_COUNT;

      if (frameIdx !== lastFrame) {
        lastFrame = frameIdx;
        const img = imagesRef.current[frameIdx];
        if (img?.complete && img.naturalHeight > 0) {
          draw(img);
        }
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribe();
    };
  }, [targetFrameValue]);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden touch-none cursor-default"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* LOGOTIPO CENTRALIZADO (Largura Responsiva) */}
      <div className="absolute bottom-16 sm:bottom-20 md:bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-auto w-[85%] max-w-[320px] sm:max-w-[450px] md:max-w-[650px] group">
        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
          {activePhaseIndex === 0 && (
            <DialogTrigger asChild>
              <button className="text-[12px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors mb-6">
                Entrar
              </button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-[425px] bg-transparent backdrop-blur-xl border border-white/10 text-white rounded-xl shadow-2xl shadow-black/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
                <div>Saber Mais</div>
                <div className="text-base font-normal normal-case tracking-normal text-white/70">
                  {authMode === 'login' ? 'Acesso à Plataforma' : 'Criar Nova Conta'}
                </div>
              </DialogTitle>
              <DialogDescription className="text-white/60">
                {authMode === 'login' 
                  ? 'Faça login para explorar os módulos e materiais didáticos.'
                  : 'Preencha os seus dados para se registar na plataforma.'
                }
              </DialogDescription>
            </DialogHeader>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-white/70">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-white/70">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                {error && <p className="text-sm font-medium text-red-400">{error}</p>}
                <Button type="submit" className="w-full rounded-md border border-white/50 bg-white/10 text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest py-6 transition-all duration-300">
                  Entrar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-white/70">Nome</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Seu nome"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-white/70">Apelido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Seu apelido"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register" className="text-xs font-bold uppercase tracking-widest text-white/70">Email</Label>
                  <Input
                    id="email-register"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register" className="text-xs font-bold uppercase tracking-widest text-white/70">Password</Label>
                  <Input
                    id="password-register"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md border-white/20 bg-transparent focus:border-white text-base text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-white/70">Função</Label>
                  <RadioGroup defaultValue="formando" value={role} onValueChange={setRole} className="flex items-center gap-6 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="formando" id="role-formando" className="border-white/50 text-white focus:ring-white"/>
                      <Label htmlFor="role-formando" className="font-normal text-sm text-white/90 normal-case">Formando</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="formador" id="role-formador" className="border-white/50 text-white focus:ring-white"/>
                      <Label htmlFor="role-formador" className="font-normal text-sm text-white/90 normal-case">Formador</Label>
                    </div>
                  </RadioGroup>
                </div>
                {error && <p className="text-sm font-medium text-red-400">{error}</p>}
                <Button type="submit" className="w-full rounded-md border border-white/50 bg-white/10 text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest py-6 transition-all duration-300">
                  Registar
                </Button>
              </form>
            )}

            <div className="mt-2 text-center text-sm text-white/60">
              {authMode === 'login' ? (
                <>
                  Não tem conta?{' '}
                  <button onClick={() => setAuthMode('register')} className="font-semibold underline hover:text-white">
                    Registe-se
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{' '}
                  <button onClick={() => setAuthMode('login')} className="font-semibold underline hover:text-white">
                    Entrar
                  </button>
                </>
              )}
            </div>

          </DialogContent>
        </Dialog>

        <motion.img
          src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Logo%20Sabermais/sabermais%203D.png"
          alt="Logotipo Saber Mais 3D"
          onClick={() => goToPhase(0)}
          className="h-24 sm:h-32 md:h-40 w-auto object-contain cursor-pointer mix-blend-screen contrast-125 brightness-110"
        />
        <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white text-center leading-relaxed drop-shadow-[0_2px_5px_rgba(0,0,0,1)] opacity-90 mt-4 md:mt-6">
          Programa de Apoio ao Reforço do <br className="hidden sm:block" />Ensino Secundário em Angola
        </p>
      </div>

      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="flex flex-col items-center gap-2 text-white/30">
              <Mouse size={20} className="sm:w-6 sm:h-6" strokeWidth={1} />
              <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.5em]">Scroll</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER (Paddings Responsivos) */}
      <header className="absolute top-0 left-0 w-full z-30 px-6 sm:px-12 md:px-24 lg:px-40 py-8 md:py-12 flex justify-between items-center pointer-events-none">
        <div className="w-24 md:w-32" />
        {/* Menu esconde em mobile muito pequeno, mostra em tablet/desktop */}
        <nav className="hidden md:flex flex-wrap justify-end gap-8 lg:gap-16 pointer-events-auto pt-[10px]">
          {PROGRAM_PHASES.map((phase, index) => {
            if (index === 0) return null;

            return (
              <button
                key={phase.id}
                onClick={() => goToPhase(index)}
                className={`flex items-baseline gap-2 lg:gap-3 transition-all duration-700 group ${
                  activePhaseIndex === index ? "scale-105" : "hover:scale-105"
                }`}
              >
                <span className={`text-[10px] lg:text-[12px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${
                  activePhaseIndex === index ? "text-white drop-shadow-[0_0_8px_white]" : "text-white/10 group-hover:text-white/40"
                }`}>
                  0{index}
                </span>
                <span className={`text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.2em] lg:tracking-[0.3em] transition-all duration-500 hidden lg:inline-block ${
                  activePhaseIndex === index ? "text-white opacity-100" : "text-white/0 opacity-0 group-hover:text-white/10 group-hover:opacity-100"
                }`}>
                  {phase.name}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* BLOCO DE TEXTOS E BARRA DE PROGRESSO */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-6 sm:px-12 md:px-24 lg:px-40 pb-0 pointer-events-none">
        <div className="flex justify-between items-end w-full max-w-[1800px] mx-auto relative h-full">

          {/* CONTROLOS LATERAIS RESPONSIVOS */}
          <div className="absolute bottom-[35vh] lg:bottom-[35vh] right-0 flex flex-col items-center gap-6 md:gap-10 pointer-events-auto">
            <div className="flex flex-col items-center gap-3 md:gap-4">
              <span className="text-[7px] md:text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] rotate-90 md:rotate-0 mb-4 md:mb-0">Fase</span>
              <div className="relative h-24 sm:h-32 md:h-48 w-[1px] bg-white/10">
                <motion.div style={{ height: progressBarHeight }} className="absolute top-0 w-full bg-white shadow-[0_0_15px_white]" />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:gap-4">
              <button onClick={() => goToPhase(activePhaseIndex - 1)} className="p-2 md:p-4 bg-white/5 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all cursor-pointer"><ChevronUp size={16} className="md:w-5 md:h-5" /></button>
              <button onClick={() => goToPhase(activePhaseIndex + 1)} className="p-2 md:p-4 bg-white/5 rounded-full text-white/20 hover:text-white hover:bg-white/10 transition-all cursor-pointer"><ChevronDown size={16} className="md:w-5 md:h-5" /></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
