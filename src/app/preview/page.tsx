"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, AnimatePresence, animate } from "framer-motion";
import { LogIn, User, Camera, GraduationCap, UserCheck, Calendar, FileText, LogOut, Loader2, QrCode, Mail, ShieldCheck, Users, BarChart3, MapPin, BookOpen, LayoutDashboard, Handshake, Clock, CheckCircle, Languages, Calculator, FlaskConical, Globe, Landmark, Leaf, Zap, TestTube, FolderOpen, Facebook, Instagram, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BASE_FRAME_URL, DASHBOARD_URL } from "@/lib/program-config";
import { PhasesSidebar } from "@/components/PhasesSidebar"; 
import { Navigator } from "@/components/Navigator";
import { CommandCenter } from "@/components/CommandCenter";
import { HeroBranding } from "@/components/HeroBranding";
import { TourGuide, shouldShowTour } from "@/components/TourGuide";
import { useProfile } from "@/hooks/useProfile";
import { useLocalidades } from "@/hooks/useLocalidades";
import { QRCodeSVG } from "qrcode.react";

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

// Menu das páginas públicas reais do site — usado nesta pré-visualização em vez das "fases" antigas
const REAL_MENU = [
  { id: "menu-0", name: "" }, // placeholder — PhasesSidebar ignora o índice 0
  { id: "menu-1", name: "Saber Mais", href: "/saber-mais" },
  { id: "menu-2", name: "Províncias", href: "/provincias" },
  { id: "menu-3", name: "Formadores", href: "/formadores" },
  { id: "menu-4", name: "Recursos", href: "/recursos" },
  { id: "menu-5", name: "Eventos", href: "/eventos" },
  { id: "menu-6", name: "Agenda", href: "/agenda-publica" },
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
    const interval = setInterval(() => setIdx(p => (p + 1) % data.length), 6000);
    return () => clearInterval(interval);
  }, [data]);

  if (!data || data.length === 0) return null;
  const f = data[idx];
  const avatar = f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${f.first_name}&backgroundColor=1e293b&textColor=ffffff`;

  const rawEsp = f.especialidade || f.specialization || "";
  const especialidade = (() => {
    try {
      const parsed = JSON.parse(rawEsp);
      if (Array.isArray(parsed)) return parsed.filter((v: string) => v && !v.includes("@")).join(" · ") || "Área Pedagógica";
    } catch {}
    return rawEsp.includes("@") ? "Área Pedagógica" : (rawEsp || "Área Pedagógica");
  })();

  const prev = () => setIdx(p => (p - 1 + data.length) % data.length);
  const next = () => setIdx(p => (p + 1) % data.length);

  return (
    <div className="w-full mt-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
      {/* Conteúdo — só este troca, sem animar o container */}
      <div className="flex gap-4 px-5 pt-5 pb-4">
        <img src={avatar} className="w-16 h-16 rounded-xl border border-white/20 object-cover shrink-0 shadow-lg" alt="Formador" />
        <div className="flex flex-col min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              <p className="text-base font-bold text-white leading-tight">{f.first_name} {f.last_name}</p>
              <p className="text-[9px] text-emerald-400 uppercase tracking-[0.2em] font-bold mt-0.5">{especialidade}</p>
              {f.escola && <p className="text-[10px] text-white/40 mt-1 truncate">{f.escola}</p>}
              <p className="text-[11px] text-white/65 mt-2 leading-relaxed line-clamp-3">{f.biografia || "Formador de excelência no reforço pedagógico do ensino secundário."}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Rodapé com navegação */}
      {data.length > 1 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.07] bg-white/[0.02]">
          <div className="flex gap-1">
            {data.map((_: any, i: number) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-4 bg-emerald-400" : "w-1 bg-white/20"}`} />
            ))}
          </div>
          <p className="text-[9px] text-white/30 font-mono">{idx + 1} / {data.length}</p>
          <div className="flex gap-1">
            <button onClick={prev} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6 2L3 5L6 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={next} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 2L7 5L4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ForgotPasswordLink() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao enviar email.");
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-center text-[9px] uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors mt-1">
        Recuperar password
      </button>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setOpen(false); setSent(false); setEmail(""); }} />
          <div className="relative w-full max-w-sm bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recuperar password</h3>
              <p className="text-[10px] text-white/40 mt-1">Introduza o seu e-mail e enviaremos um link para repor a password.</p>
            </div>

            <div className="space-y-4">
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                disabled={sent}
                placeholder="o-seu-email@exemplo.com"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 placeholder:text-white/20 disabled:opacity-40"
              />

              {/* Resultado */}
              {sent && (
                <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <span className="text-emerald-400 text-lg leading-none">✓</span>
                  <div>
                    <p className="text-emerald-400 text-xs font-semibold">Email enviado!</p>
                    <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">Verifique a sua caixa de entrada e siga as instruções para redefinir a password.</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <span className="text-red-400 text-lg leading-none">✕</span>
                  <div>
                    <p className="text-red-400 text-xs font-semibold">Não foi possível enviar</p>
                    <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={loading || sent}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(e as any); }}
                className="w-full py-3 rounded-lg bg-blue-600 text-white text-xs font-semibold uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {sent ? "Link enviado" : "Enviar link"}
              </button>

              {(sent || error) && (
                <button type="button" onClick={() => { setOpen(false); setSent(false); setEmail(""); setError(null); }}
                  className="w-full text-center text-[10px] text-white/25 hover:text-white/60 transition-colors">
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PhaseNavigator({ goToPhase }: { goToPhase: (i: number) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const p = searchParams.get("phase");
    if (p !== null) {
      const idx = parseInt(p, 10);
      if (!isNaN(idx) && idx >= 0 && idx < PROGRAM_PHASES.length) {
        setTimeout(() => goToPhase(idx), 150);
      }
    }
  }, [searchParams, goToPhase]);
  return null;
}

export default function HeroSection() {
  const isDashboardView = false;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const router = useRouter();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const { provincias: provinciasAngola, getMunicipios: getMunicipiosAngola } = useLocalidades();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isVIPWelcomeOpen, setIsVIPWelcomeOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [userRole, setUserRole] = useState<'formando' | 'formador'>('formando');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [provincia, setProvincia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [escola, setEscola] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Imagem e QR Code
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"local" | "qr">("local");
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const [telemetry, setTelemetry] = useState<any>(null);
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Set<string>>(new Set());
  const [inscrevendo, setInscrevendo] = useState(false);

  useEffect(() => {
    if (!profile?.id) { setMinhasInscricoes(new Set()); return; }
    fetch(`/api/db/inscricoes_agenda?eq.user_id=${profile.id}`)
      .then(r => r.json())
      .then(({ data }) => setMinhasInscricoes(new Set((data ?? []).map((i: any) => i.evento_id))))
      .catch(() => {});
  }, [profile?.id]);

  async function handleInscricaoPublica(eventoId: string) {
    if (!profile?.id) return;
    setInscrevendo(true);
    try {
      await fetch("/api/db/inscricoes_agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profile.id, evento_id: eventoId }),
      });
      setMinhasInscricoes(prev => new Set(prev).add(eventoId));
    } finally {
      setInscrevendo(false);
    }
  }

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const targetFrameValue = useMotionValue(PROGRAM_PHASES[0].focusFrame);
  const isCooldown = useRef(false);
  const scrollIntent = useRef(0);

  // Geração de Sessão para QR Code
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 11) + Date.now().toString(36));
  }, []);

  // Auto-start tour for first-time visitors
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowTour()) setTourActive(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);


  // Escuta do Telemóvel via SSE
  useEffect(() => {
    if (!sessionId || userRole !== 'formador' || authMode !== 'register') return;

    const es = new EventSource(`/api/sse/camera/${sessionId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.url) {
          setAvatarPreview(data.url);
          setRemoteImageUrl(data.url);
          setUploadMode("local");
        }
      } catch {}
    };

    return () => { es.close(); };
  }, [sessionId, userRole, authMode]);

  useEffect(() => {
    if (isDashboardView) return;
    fetch("/api/public/hero")
      .then(r => r.json())
      .then(data => { setTelemetry(data); })
      .catch(() => {});
  }, [isDashboardView]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const triggerVIPTransition = async () => {
    await refreshProfile();
    setIsVIPWelcomeOpen(true);
    setTimeout(() => { router.push(DASHBOARD_URL); }, 3200); 
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Verificar credenciais e estado da conta via API própria
      const sessionRes = await fetch("/api/auth/session-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionRes.ok) {
        setError(sessionData.error ?? "Erro ao autenticar.");
        setLoading(false);
        return;
      }

      await triggerVIPTransition();
    } catch {
      setError("Erro de ligação. Tente novamente.");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validação Estrita do Formador
    if (userRole === 'formador') {
      if (!avatarPreview && !remoteImageUrl) { setError("Fotografia de perfil é obrigatória."); return; }
      if (!especialidade.trim()) { setError("Especialidade é obrigatória."); return; }
      if (!bio.trim()) { setError("Síntese Biográfica é obrigatória."); return; }
    }

    setLoading(true);

    // Registo na nossa API local
    const syncRes = await fetch("/api/auth/sync-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: userRole,
        ...(userRole === 'formando' ? { provincia, municipio, escola } : { especialidade, biografia: bio }),
      }),
    });
    const syncData = await syncRes.json();
    if (!syncRes.ok) { setError(syncData.error ?? "Erro ao criar conta."); setLoading(false); return; }

    // Upload do avatar do formador para a nossa API de storage
    if (userRole === 'formador' && avatarFile) {
      const form = new FormData();
      form.append("bucket", "avatars");
      form.append("path", `formadores/${Math.random().toString(36).slice(2)}.${avatarFile.name.split('.').pop()}`);
      form.append("file", avatarFile);
      const upRes = await fetch("/api/storage/upload", { method: "POST", body: form });
      const upData = await upRes.json();
      if (upRes.ok && upData.data?.path) {
        await fetch("/api/auth/sync-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role: userRole, avatar_url: `/storage/v1/object/public/avatars/${upData.data.path}` }),
        });
      }
    }

    setIsSuccess(true);
    setLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoteImageUrl(null);
    }
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

  const handleMenuClick = useCallback((rawIndex: number) => {
    const len = REAL_MENU.length;
    let idx = ((rawIndex % len) + len) % len;
    if (idx === 0) idx = len - 1;
    const item = REAL_MENU[idx];
    if (item.href) {
      window.location.href = item.href;
      return;
    }
    goToPhase(idx);
  }, [goToPhase]);

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

  // Swipe vertical no mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (isDashboardView || isCooldown.current) return;
      const delta = startY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 40) return;
      if (delta > 0) goToPhase(activePhaseIndex + 1);
      else goToPhase(activePhaseIndex - 1);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchend", onTouchEnd); };
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrCodeUrl = `${origin}/camera/${sessionId}`;
  const finalFullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email;

  const getDynamicPhaseContent = (index: number) => {
    const base = PROGRAM_PHASES[index];
    const defaultTextClass = "text-sm font-bold text-white leading-relaxed" + ' ' + "[text-shadow:0_1px_8px_rgba(0,0,0,0.95)]";

    if (!telemetry) return { ...base, description: <span className={defaultTextClass}>{base.description}</span> };

    switch (index) {
      case 1:
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>{base.description}</p>
              <div className="flex flex-wrap gap-3 mt-2">
                {[
                  { icon: MapPin,     value: "2",        label: "Províncias" },
                  { icon: Handshake,  value: "2026",     label: "Ano em curso" },
                  { icon: GraduationCap, value: `${telemetry.total_formadores || 0}`, label: "Formadores" },
                  { icon: Users,      value: `${telemetry.total_formandos || 0}`,    label: "Formandos" },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
                    <Icon size={14} className="text-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white leading-none">{value}</p>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        };
      case 2: {
        const eventos = telemetry.proximos_eventos ?? [];
        const PARTNERS = [
          { name: "Governo de Angola", subtitle: "Ministério da Educação", src: "/storage/v1/object/public/Logo%20Institutos/med.png" },
          { name: "República de Angola", subtitle: "Insígnia Oficial", src: "/storage/v1/object/public/Logo%20Institutos/insignia.png" },
          { name: "INFQE", subtitle: "Instituto de Formação", src: "/storage/v1/object/public/Logo%20Institutos/infqe.png" },
          { name: "Camões, I.P.", subtitle: "Cooperação Portuguesa", src: "/storage/v1/object/public/Logo%20Institutos/icamoes.png" },
        ];
        return {
          ...base,
          description: (
            <div className="space-y-3 w-full max-w-sm">
              {/* Caixa Agenda */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.08)]">
                {/* Cabeçalho */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07] bg-white/[0.03]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Calendar size={13} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 leading-none">Agenda</p>
                    <p className="text-[8px] text-blue-400/70 tracking-widest uppercase mt-0.5">Próximos eventos</p>
                  </div>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Lista de eventos */}
                <div className="divide-y divide-white/[0.05]">
                  {eventos.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-[11px] text-white/30 italic">Sem eventos agendados</p>
                    </div>
                  ) : eventos.map((ev: any, i: number) => {
                    const d = new Date(ev.data_evento);
                    const dias = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
                    return (
                      <div key={i} onClick={() => setSelectedEvento(ev)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer">
                        <div className="shrink-0 w-9 text-center">
                          <p className="text-[15px] font-black text-white leading-none">{d.getDate().toString().padStart(2,"0")}</p>
                          <p className="text-[8px] uppercase tracking-wider text-blue-400/80 leading-none mt-0.5">{d.toLocaleString("pt-PT",{month:"short"})}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white/90 leading-tight truncate">{ev.titulo}</p>
                          {ev.local && <p className="text-[9px] text-white/40 mt-0.5 truncate">{ev.local}{ev.endereco ? ` — ${ev.endereco}` : ""}</p>}
                        </div>
                        <div className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${dias === 0 ? "bg-emerald-500/20 text-emerald-400" : dias <= 7 ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/40"}`}>
                          {dias === 0 ? "Hoje" : `${dias}d`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ticker parceiros */}
              <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] py-2">
                <div className="flex animate-[ticker_18s_linear_infinite] gap-6 w-max">
                  {[...PARTNERS, ...PARTNERS].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 shrink-0 px-2">
                      <div className="w-7 h-7 bg-white rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        <img src={p.src} alt={p.name} className="w-full h-full object-contain scale-110" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-white/80 leading-none whitespace-nowrap">{p.name}</p>
                        <p className="text-[7px] text-white/30 tracking-wider whitespace-nowrap">{p.subtitle}</p>
                      </div>
                      <span className="text-white/10 ml-2">·</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        };
      }
      case 3:
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>A promoção da supervisão apoia-se em <strong className="text-blue-300">{telemetry.total_formadores || 3} formadores</strong> de excelência.</p>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300 font-bold">Equipa de Formadores</p>
                <FormadoresLoop formadores={telemetry.formadores_lista} />
              </div>
            </div>
          )
        };
      case 4: {
        const luanda = telemetry.provincias_stats?.luanda ?? { formadores: 0, formandos: 0 };
        const bie    = telemetry.provincias_stats?.bie    ?? { formadores: 0, formandos: 0 };
        return {
          ...base,
          description: (
            <div className="space-y-4">
              <p className={defaultTextClass}>{base.description}</p>
              <div className="flex gap-3 mt-1">
                {[
                  { nome: "Luanda", data: luanda, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
                  { nome: "Bié",    data: bie,    color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
                ].map(({ nome, data, color, border, bg }) => (
                  <div key={nome} className={`flex-1 rounded-xl border ${border} ${bg} backdrop-blur-sm px-4 py-3 space-y-2`}>
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${color}`}>{nome}</p>
                    <div className="flex gap-3">
                      <div>
                        <p className="text-lg font-bold text-white leading-none">{data.formadores}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] mt-0.5">Formadores</p>
                      </div>
                      <div className="w-px bg-white/10" />
                      <div>
                        <p className="text-lg font-bold text-white leading-none">{data.formandos}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] mt-0.5">Formandos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        };
      }
      case 5: {
        const areaColors: Record<string, { bg: string; text: string; border: string; dot: string; icon: React.ElementType }> = {
          "Matemática":        { bg: "bg-blue-900/60",    text: "text-blue-200",   border: "border-blue-400/40",   dot: "bg-blue-400",    icon: Calculator },
          "Língua Portuguesa": { bg: "bg-emerald-900/60", text: "text-emerald-200",border: "border-emerald-400/40",dot: "bg-emerald-400", icon: Languages },
          "Português":         { bg: "bg-emerald-900/60", text: "text-emerald-200",border: "border-emerald-400/40",dot: "bg-emerald-400", icon: Languages },
          "Ciências":          { bg: "bg-cyan-900/60",    text: "text-cyan-200",   border: "border-cyan-400/40",   dot: "bg-cyan-400",    icon: FlaskConical },
          "História":          { bg: "bg-amber-900/60",   text: "text-amber-200",  border: "border-amber-400/40",  dot: "bg-amber-400",   icon: Landmark },
          "Geografia":         { bg: "bg-lime-900/60",    text: "text-lime-200",   border: "border-lime-400/40",   dot: "bg-lime-400",    icon: Globe },
          "Biologia":          { bg: "bg-green-900/60",   text: "text-green-200",  border: "border-green-400/40",  dot: "bg-green-400",   icon: Leaf },
          "Física":            { bg: "bg-violet-900/60",  text: "text-violet-200", border: "border-violet-400/40", dot: "bg-violet-400",  icon: Zap },
          "Química":           { bg: "bg-pink-900/60",    text: "text-pink-200",   border: "border-pink-400/40",   dot: "bg-pink-400",    icon: TestTube },
          "Pedagogia":         { bg: "bg-orange-900/60",  text: "text-orange-200", border: "border-orange-400/40", dot: "bg-orange-400",  icon: GraduationCap },
          "Geral":             { bg: "bg-white/10",       text: "text-white/80",   border: "border-white/20",      dot: "bg-white/50",    icon: FolderOpen },
        };
        const defaultAreaColor = { bg: "bg-white/10", text: "text-white/80", border: "border-white/20", dot: "bg-white/50", icon: FolderOpen };
        const areasFormadores: { area: string; total: number }[] = telemetry.areas_materiais ?? [];
        const areasPublicas: { area: string; total: number }[] = telemetry.areas_publicas ?? [];
        const totalPublicos: number = telemetry.total_recursos_publicos ?? 0;
        const totalFormadores: number = areasFormadores.reduce((s, a) => s + a.total, 0);

        return {
          ...base,
          description: (
            <div className="space-y-3 w-full max-w-sm">
              <p className={defaultTextClass}>{base.description}</p>

              {/* Cabeçalho */}
              {areasFormadores.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-blue-300/80 font-semibold">Repositório de Professores</span>
                  <span className="text-[9px] text-white/30 ml-auto">{totalFormadores} materiais</span>
                </div>
              )}

              {/* Cards de área — grelha compacta de 3 colunas, no máximo 2 linhas, sem scroll */}
              <div className="grid grid-cols-3 gap-2">
                {areasFormadores.slice(0, 6).map(({ area, total }, i) => {
                  const c = areaColors[area] ?? defaultAreaColor;
                  const Icon = c.icon;
                  return (
                    <motion.div
                      key={area}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                      className={`relative rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} backdrop-blur-md px-2.5 py-2 overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-12 h-12 rounded-full blur-2xl ${c.dot} opacity-20 -translate-y-1/2 translate-x-1/2`} />
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md bg-white/10 flex items-center justify-center shrink-0`}>
                          <Icon size={10} className={c.text} />
                        </div>
                        <p className={`text-xl font-black tabular-nums leading-none ${c.text}`}>{total}</p>
                      </div>
                      <p className="text-[8px] text-white/50 uppercase tracking-[0.12em] mt-1.5 font-medium leading-tight">{area}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Card Recursos Públicos — clicável, destaque */}
              <motion.a
                href="/recursos"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 w-full rounded-xl border-2 border-emerald-400/40 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 backdrop-blur-md px-4 py-3 pointer-events-auto hover:border-emerald-400/70 hover:from-emerald-900/60 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300 leading-none">Recursos Públicos</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{totalPublicos > 0 ? `${totalPublicos} documentos disponíveis` : "Acesso livre · Sem login"}</p>
                </div>
                <span className="text-emerald-400/60 group-hover:translate-x-1 transition-transform text-base font-light">→</span>
              </motion.a>
            </div>
          ),
        };
      }
      case 6: {
        const metrics = [
          {
            icon: Users,
            value: telemetry.total_formandos || 0,
            label: "Formandos activos",
            color: "from-blue-500/20 to-blue-600/5",
            border: "border-blue-500/20",
            iconColor: "text-blue-400",
            glow: "bg-blue-500/10",
          },
          {
            icon: GraduationCap,
            value: telemetry.total_formadores || 0,
            label: "Formadores",
            color: "from-emerald-500/20 to-emerald-600/5",
            border: "border-emerald-500/20",
            iconColor: "text-emerald-400",
            glow: "bg-emerald-500/10",
          },
          {
            icon: FileText,
            value: telemetry.total_materials || 0,
            label: "Materiais pedagógicos",
            color: "from-amber-500/20 to-amber-600/5",
            border: "border-amber-500/20",
            iconColor: "text-amber-400",
            glow: "bg-amber-500/10",
          },
          {
            icon: BookOpen,
            value: telemetry.total_turmas || 0,
            label: "Turmas criadas",
            color: "from-violet-500/20 to-violet-600/5",
            border: "border-violet-500/20",
            iconColor: "text-violet-400",
            glow: "bg-violet-500/10",
          },
        ];
        // Calcular indicadores de performance
        const totalFormandos = telemetry.total_formandos || 0;
        const totalFormadores = telemetry.total_formadores || 0;
        const totalMateriais = telemetry.total_materials || 0;
        const totalTurmas = telemetry.total_turmas || 0;
        const luanda = telemetry.provincias_stats?.luanda ?? { formadores: 0, formandos: 0 };
        const bie = telemetry.provincias_stats?.bie ?? { formadores: 0, formandos: 0 };

        // Índice de actividade (0-100): pesos baseados nas métricas disponíveis
        const metaFormandos = 50, metaFormadores = 15, metaMateriais = 30, metaTurmas = 10;
        const indiceActividade = Math.min(100, Math.round(
          (Math.min(totalFormandos / metaFormandos, 1) * 40) +
          (Math.min(totalFormadores / metaFormadores, 1) * 25) +
          (Math.min(totalMateriais / metaMateriais, 1) * 25) +
          (Math.min(totalTurmas / metaTurmas, 1) * 10)
        ));

        // Rácio formador/formando
        const ratioVal = totalFormadores > 0 ? (totalFormandos / totalFormadores).toFixed(1) : "—";
        const ratioIdeal = totalFormadores > 0 ? Math.min(100, Math.round((1 / (totalFormandos / Math.max(totalFormadores * 10, 1))) * 100)) : 0;

        // Cobertura geográfica
        const totalLuanda = luanda.formadores + luanda.formandos;
        const totalBie = bie.formadores + bie.formandos;
        const totalGeo = totalLuanda + totalBie || 1;

        return {
          ...base,
          description: (
            <div className="space-y-2 w-full max-w-3xl">
              <p className={defaultTextClass}>{base.description}</p>

              {/* Layout: 4 métricas + 3 indicadores em 2 colunas expandidas */}
              <div className="grid grid-cols-2 gap-2">

                {/* Coluna esquerda — 4 métricas 2×2, altura igual à direita */}
                <div className="grid grid-cols-2 grid-rows-2 gap-1.5">
                  {metrics.map(({ icon: Icon, value, label, color, border, iconColor, glow }) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                      className={`relative rounded-lg border ${border} bg-gradient-to-br ${color} backdrop-blur-md px-3 py-3 overflow-hidden flex flex-col justify-between`}>
                      <div className={`absolute top-0 right-0 w-10 h-10 rounded-full blur-xl ${glow} -translate-y-1/2 translate-x-1/2`} />
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} className={iconColor} />
                        <p className="text-[8px] text-white/50 uppercase tracking-[0.12em] font-medium leading-tight truncate">{label}</p>
                      </div>
                      <p className="text-2xl font-bold text-white tabular-nums leading-none">{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Coluna direita — 3 indicadores empilhados */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[7px] uppercase tracking-[0.25em] text-white/25 font-semibold">Indicadores de Performance</p>

                  {/* Índice de Actividade */}
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md px-2.5 py-2 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[8px] font-semibold text-white/60 uppercase tracking-wider">Índice de Actividade</p>
                      <span className={`text-xs font-black tabular-nums ${indiceActividade >= 70 ? "text-emerald-400" : indiceActividade >= 40 ? "text-amber-400" : "text-red-400"}`}>{indiceActividade}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${indiceActividade}%` }} transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className={`h-full rounded-full ${indiceActividade >= 70 ? "bg-emerald-400" : indiceActividade >= 40 ? "bg-amber-400" : "bg-red-400"}`} />
                    </div>
                    <p className="text-[6px] text-white/20 mt-1">Formandos · Formadores · Materiais · Turmas</p>
                  </motion.div>

                  {/* Rácio */}
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md px-2.5 py-2 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[8px] font-semibold text-white/60 uppercase tracking-wider">Rácio / Formador</p>
                      <span className="text-xs font-black tabular-nums text-blue-400">{ratioVal}:1</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, totalFormadores > 0 ? (totalFormandos / totalFormadores / 10) * 100 : 0)}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} className="h-full rounded-full bg-blue-400" />
                    </div>
                    <p className="text-[6px] text-white/20 mt-1">Meta ideal: ≤ 10 formandos / formador</p>
                  </motion.div>

                  {/* Cobertura Geográfica */}
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md px-2.5 py-2 flex-1">
                    <p className="text-[8px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">Cobertura Geográfica</p>
                    {[
                      { nome: "Luanda", total: totalLuanda, cor: "bg-blue-400" },
                      { nome: "Bié",    total: totalBie,    cor: "bg-amber-400" },
                    ].map(({ nome, total, cor }) => (
                      <div key={nome} className="mb-1.5 last:mb-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[7px] text-white/40 uppercase tracking-wider">{nome}</span>
                          <span className="text-[7px] font-bold text-white/50 tabular-nums">{total} part.</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((total / totalGeo) * 100)}%` }}
                            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} className={`h-full rounded-full ${cor}`} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          ),
        };
      }
      default:
        return { ...base, description: <span className={defaultTextClass}>{base.description}</span> };
    }
  };

  const activeData = getDynamicPhaseContent(activePhaseIndex);

  return (
    <div ref={containerRef} className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans md:cursor-none selection:bg-blue-500/30">

      {/* CommandCenter removido da hero — navegação feita pelo topo direito */}

      <motion.div className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[100] mix-blend-difference hidden md:block" style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }} animate={{ scale: isHovering ? 3.5 : 1, opacity: 0.8 }} transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.2 }} />

      <div className="absolute inset-0 z-10">
        <canvas ref={canvasRef} className="w-full h-full contrast-115 saturate-110 brightness-95 transform-gpu" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        {/* Vignette lateral esquerda — garante legibilidade do texto em qualquer frame do vídeo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent pointer-events-none" />
      </div>

      <AnimatePresence>
        {!isDashboardView && (
          <motion.div key="hero-main-ui" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(20px)" }} className="absolute inset-0 z-30 pointer-events-none" >
            
            
            {/* O SEU POP-UP ORIGINAL, AGORA COM TUDO LÁ DENTRO */}
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogContent className="w-[95vw] sm:max-w-[520px] bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 text-white rounded-[2.5rem] p-10 pointer-events-auto z-[200]">
                
                {isSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-6 py-8">
                    <ShieldCheck size={56} className="text-emerald-500" />
                    <div className="space-y-3">
                      <h2 className="text-xl font-light uppercase tracking-[0.2em]">Verifique o seu email</h2>
                      <p className="text-[10px] uppercase tracking-widest text-white/50 leading-relaxed">
                        Enviámos um email para <span className="text-white">{email}</span>. Clique no link de confirmação para verificar que é dono deste endereço.
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/80 leading-relaxed">
                        Só após confirmar o email é que o administrador poderá aprovar a sua conta.
                      </p>
                    </div>
                    <Button onClick={() => setIsLoginOpen(false)} className="rounded-full bg-white text-black hover:bg-blue-500 hover:text-white uppercase tracking-[0.2em] text-[9px] px-8">Fechar</Button>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={authMode} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="w-full flex flex-col">
                      <DialogHeader className="mb-6 text-center">
                        <DialogTitle className="flex flex-col items-center gap-1">
                          <span className="text-xl font-light uppercase tracking-[0.3em] italic">Portal Saber Mais</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                            {authMode === 'login' ? 'Acesso Restrito' : 'Categorização de Utilizador'}
                          </span>
                        </DialogTitle>
                      </DialogHeader>

                      {authMode === 'register' && (
                        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
                          <button type="button" onClick={() => setUserRole('formando')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] uppercase tracking-widest transition-all ${userRole === 'formando' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}><GraduationCap size={14} /> Formando</button>
                          <button type="button" onClick={() => setUserRole('formador')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] uppercase tracking-widest transition-all ${userRole === 'formador' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}><UserCheck size={14} /> Formador</button>
                        </div>
                      )}

                      {authMode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                          <div className="space-y-1"><Label className="text-[9px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-none border-0 border-b border-white/20 bg-transparent px-0 focus-visible:ring-0 shadow-none"/></div>
                          <div className="space-y-1 relative">
                            <Label className="text-[9px] uppercase tracking-widest text-white/40">Passe</Label>
                            <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-none border-0 border-b border-white/20 bg-transparent px-0 pr-7 focus-visible:ring-0 shadow-none"/>
                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-0 bottom-2 text-white/30 hover:text-white/70 transition-colors">
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          {error && <p className="text-[10px] text-red-400 uppercase tracking-widest text-center">{error}</p>}
                          <Button type="submit" disabled={loading} className="w-full rounded-2xl border bg-white/5 hover:bg-white hover:text-black font-medium uppercase tracking-[0.3em] py-6 text-[11px] shadow-none mt-4 transition-all">
                            {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
                          </Button>
                          <ForgotPasswordLink />
                        </form>
                      ) : (
                        <form onSubmit={handleSignUp} className="space-y-4">

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-[8px] uppercase tracking-widest text-white/40">Nome</Label><Input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs"/></div>
                            <div className="space-y-1"><Label className="text-[8px] uppercase tracking-widest text-white/40">Apelido</Label><Input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs"/></div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-[8px] uppercase tracking-widest text-white/40">E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs"/></div>
                            <div className="space-y-1 relative">
                              <Label className="text-[8px] uppercase tracking-widest text-white/40">Passe</Label>
                              <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs pr-6"/>
                              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-0 bottom-1.5 text-white/30 hover:text-white/70 transition-colors">
                                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </div>

                          {userRole === 'formando' ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[8px] uppercase tracking-widest text-blue-400">Província</Label>
                                  <select required value={provincia} onChange={(e) => { setProvincia(e.target.value); setMunicipio(''); }} className="w-full h-8 bg-transparent border-0 border-b border-white/20 text-xs text-white outline-none cursor-pointer appearance-none">
                                    <option value="" disabled className="bg-[#0d0d14]">Seleccionar</option>
                                    {provinciasAngola.map(p => (
                                      <option key={p} value={p} className="bg-[#0d0d14]">{p}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] uppercase tracking-widest text-blue-400">Município</Label>
                                  <select required value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={!provincia} className="w-full h-8 bg-transparent border-0 border-b border-white/20 text-xs text-white outline-none cursor-pointer appearance-none disabled:opacity-40">
                                    <option value="" disabled className="bg-[#0d0d14]">{provincia ? 'Seleccionar' : 'Escolhe a província'}</option>
                                    {getMunicipiosAngola(provincia).map(m => (
                                      <option key={m} value={m} className="bg-[#0d0d14]">{m}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1"><Label className="text-[8px] uppercase tracking-widest text-blue-400">Instituição</Label><Input placeholder="Nome da Escola" required value={escola} onChange={(e) => setEscola(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs"/></div>
                            </div>
                          ) : (
                            <div className="space-y-6 pt-2">
                              {/* ZONA DO FORMADOR (FOTO + QR + ESPEC + BIO) */}
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                <Label className="text-[8px] uppercase tracking-widest text-emerald-400 block mb-2">Fotografia (Obrigatório)</Label>
                                <div className="flex gap-4 items-center">
                                  <div className="w-14 h-14 rounded-full border border-white/20 flex shrink-0 items-center justify-center overflow-hidden bg-black/50">
                                    {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera size={16} className="text-white/30" />}
                                  </div>
                                  <div className="flex flex-col gap-2 w-full">
                                    <button type="button" onClick={() => setUploadMode("local")} className={`text-[8px] py-1.5 rounded uppercase tracking-widest border transition-all ${uploadMode === 'local' ? 'bg-white text-black border-white' : 'border-white/20 text-white/50'}`}>Webcam / Ficheiro</button>
                                    <button type="button" onClick={() => setUploadMode("qr")} className={`text-[8px] py-1.5 rounded uppercase tracking-widest border transition-all ${uploadMode === 'qr' ? 'bg-emerald-500 text-black border-emerald-500' : 'border-white/20 text-white/50'}`}>Usar Telemóvel</button>
                                  </div>
                                </div>

                                {uploadMode === 'local' && (
                                  <input type="file" accept="image/*" capture="user" onChange={handleAvatarChange} className="text-[9px] w-full text-white/50 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[8px] file:uppercase file:tracking-widest file:bg-white/10 file:text-white" />
                                )}

                                {uploadMode === 'qr' && (
                                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5">
                                    <div className="bg-white p-1 rounded shrink-0"><QRCodeSVG value={qrCodeUrl} size={50} /></div>
                                    <p className="text-[8px] text-white/50 leading-relaxed uppercase tracking-widest">Aponte a câmara do telemóvel para capturar a foto.</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1"><Label className="text-[8px] uppercase tracking-widest text-emerald-400">Especialidade (Obrigatório)</Label><Input placeholder="Ex: Supervisão Pedagógica" required value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} className="h-8 bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs"/></div>
                              
                              <div className="space-y-1">
                                <Label className="text-[8px] uppercase tracking-widest text-emerald-400">Síntese Biográfica (Obrigatório)</Label>
                                <textarea required rows={2} placeholder="Escreva um breve resumo do seu perfil..." value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-transparent border-0 border-b border-white/20 rounded-none focus-visible:ring-0 text-xs text-white outline-none resize-none pt-2"/>
                              </div>
                            </div>
                          )}
                          
                          {error && <p className="text-[9px] text-red-400 uppercase tracking-widest text-center mt-2">{error}</p>}
                          
                          <Button type="submit" disabled={loading} className="w-full rounded-xl border border-white/20 bg-white/5 hover:bg-white hover:text-black font-medium uppercase tracking-[0.2em] py-6 shadow-none mt-4 transition-all text-[10px]">
                            {loading ? <Loader2 className="animate-spin" /> : "Finalizar Inscrição"}
                          </Button>
                        </form>
                      )}
                      
                      <div className="text-center text-[9px] text-white/40 mt-6 pt-4 border-t border-white/10">
                        {authMode === 'login' ? (<>Ainda não tem credenciais? <button type="button" onClick={() => { setAuthMode('register'); setError(null); }} className="font-bold text-white hover:text-blue-400 ml-1 uppercase tracking-widest transition-colors">Registe-se</button></>) : (<>Já tem conta? <button type="button" onClick={() => { setAuthMode('login'); setError(null); }} className="font-bold text-white hover:text-blue-400 ml-1 uppercase tracking-widest transition-colors">Entrar</button></>)}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

              </DialogContent>
            </Dialog>

            {/* Detalhe do evento — clicável a partir da lista da Agenda */}
            <Dialog open={!!selectedEvento} onOpenChange={(o) => { if (!o) setSelectedEvento(null); }}>
              <DialogContent className="w-[95vw] sm:max-w-[420px] bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 text-white rounded-3xl p-0 overflow-hidden pointer-events-auto z-[200]">
                {selectedEvento && (() => {
                  const d = new Date(selectedEvento.data_evento);
                  const dias = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
                  const isOnline = selectedEvento.local === "Online";
                  return (
                    <div>
                      {selectedEvento.imagem_url && (
                        <div className="w-full aspect-[16/9] bg-black/40">
                          <img src={selectedEvento.imagem_url} alt={selectedEvento.titulo} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-14 h-14 rounded-xl border border-white/15 bg-white/[0.04] flex flex-col items-center justify-center">
                            <span className="text-xl font-black leading-none text-white">{d.getDate()}</span>
                            <span className="text-[9px] uppercase tracking-wider text-blue-400/80 mt-0.5">{d.toLocaleString("pt-PT", { month: "short" })}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <DialogTitle className="text-base font-bold text-white leading-snug">{selectedEvento.titulo}</DialogTitle>
                            <p className={`flex items-center gap-1.5 text-xs font-bold mt-1 ${dias === 0 ? "text-emerald-400" : dias <= 7 ? "text-amber-400" : "text-blue-400"}`}>
                              {dias === 0 ? "Hoje" : `Faltam ${dias} dia${dias !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-sm text-white/70">
                          <p className="flex items-center gap-2">
                            <Calendar size={13} className="text-blue-400 shrink-0" />
                            {d.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={13} className="text-emerald-400 shrink-0" />
                            {isOnline ? "Online" : selectedEvento.local}{selectedEvento.endereco ? ` — ${selectedEvento.endereco}` : ""}
                          </p>
                          {selectedEvento.tipo && (
                            <p className="flex items-center gap-2 flex-wrap pt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-medium">{selectedEvento.tipo}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">{isOnline ? "Online" : "Presencial"}</span>
                            </p>
                          )}
                        </div>
                        {profile ? (
                          minhasInscricoes.has(selectedEvento.id) ? (
                            <button disabled
                              className="w-full py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 flex items-center justify-center gap-2">
                              <CheckCircle size={15} /> Inscrito
                            </button>
                          ) : (
                            <button
                              onClick={() => handleInscricaoPublica(selectedEvento.id)}
                              disabled={inscrevendo}
                              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors disabled:opacity-50"
                            >
                              {inscrevendo ? "A inscrever..." : "Inscrever-me"}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => { setSelectedEvento(null); setIsLoginOpen(true); }}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
                          >
                            Entrar para me inscrever
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>

            <TourGuide start={tourActive} onDone={() => setTourActive(false)} />

            <div className="fixed top-0 right-4 sm:right-6 md:right-16 lg:right-20 bottom-0 z-50 flex flex-col justify-between items-end py-5 sm:py-10 pointer-events-none">
              {/* TOPO: Botões de Ação */}
              <div className="pointer-events-auto shrink-0 flex items-center gap-2">
                {!profileLoading && !profile && (
                  <motion.button
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.3, ease: "easeOut" }}
                    id="tour-entrar-btn"
                    onClick={() => { setIsLoginOpen(true); setIsSuccess(false); setAuthMode('login'); }}
                    className="inline-flex items-center gap-2 px-4 h-10 sm:h-11 rounded-full border border-white/20 bg-slate-950/80 text-white/80 text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:border-blue-400/60 hover:bg-slate-900/95 hover:text-white shadow-[0_0_20px_rgba(59,130,246,0.18)] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    <LogIn size={14} />
                    <span>Entrar</span>
                  </motion.button>
                )}
                {!profileLoading && profile && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex items-center gap-2"
                  >
                    {/* Avatar */}
                    <button
                      onClick={() => router.push("/dashboard/perfil")}
                      className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-slate-950/80 overflow-hidden hover:border-white/50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                      title={profile.first_name || "Perfil"}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-white/80 uppercase">
                          {(profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "")}
                        </span>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black" />
                    </button>
                    {/* Botão Dashboard */}
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="inline-flex items-center gap-2 px-4 h-10 sm:h-11 rounded-full border border-white/20 bg-slate-950/80 text-white/80 text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:border-blue-400/60 hover:bg-slate-900/95 hover:text-white shadow-[0_0_20px_rgba(59,130,246,0.18)]"
                    >
                      <LayoutDashboard size={14} />
                      <span>Dashboard</span>
                    </button>
                  </motion.div>
                )}
                <button id="tour-help-btn" onClick={() => setTourActive(true)} className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-white transition hover:border-sky-400/60 hover:bg-slate-900/95 hover:text-white shadow-[0_0_20px_rgba(56,189,248,0.18)] focus:outline-none focus:ring-2 focus:ring-sky-400/50">
                  <span className="text-lg font-black">?</span>
                  <span className="sr-only">Abrir guia de ajuda</span>
                </button>
              </div>

              <div className="hidden md:flex flex-col items-end gap-4 md:gap-8 pointer-events-auto my-auto shrink-0 transform-gpu min-[1000px]:scale-100 scale-90 origin-right">
                <div id="tour-phases-sidebar"><PhasesSidebar activePhaseIndex={activePhaseIndex} goToPhase={handleMenuClick} phases={REAL_MENU} setIsHovering={setIsHovering} /></div>
                <div id="tour-navigator"><Navigator activePhaseIndex={activePhaseIndex} goToPhase={handleMenuClick} setIsHovering={setIsHovering} /></div>
              </div>

              <div className="pointer-events-auto shrink-0">
                <HeroBranding />
              </div>
            </div>

            <div id="tour-content" className="absolute top-[14vh] sm:top-[28vh] left-5 sm:left-10 lg:left-[160px] right-5 sm:right-auto sm:w-[90%] md:w-[540px] z-40 pointer-events-auto flex flex-col justify-between pb-20 md:pb-0" style={{minHeight: '60vh', maxHeight: '75vh'}}>
              <AnimatePresence mode="wait">
                {activePhaseIndex !== 0 && (
                  <motion.div key={activePhaseIndex} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} className="relative flex flex-col w-full h-full">
                    <div className="shrink-0">
                      <p className="text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.6em] text-white/90 uppercase font-medium truncate" style={{textShadow:"0 1px 6px rgba(0,0,0,0.9)"}}>{activeData.subtitle}</p>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mt-2" style={{textShadow:"0 2px 12px rgba(0,0,0,0.9)"}}>{activeData.name}</h1>
                    </div>
                    <div className="flex-1 mt-4">{activeData.description}</div>
                    <div className="shrink-0 pt-2 mt-auto">
                      <button onClick={() => profile ? window.open(DASHBOARD_URL, "_blank") : goToPhase(0)} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} className="group flex items-center gap-4 w-fit outline-none">
                        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-colors" style={{textShadow:"0 1px 6px rgba(0,0,0,0.9)"}}>Saber Mais</span>
                        <div className="relative w-12 h-[1px] bg-white/50 overflow-hidden"><div className="absolute top-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-500 ease-out" /></div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* BANDEIRAS DA COOPERAÇÃO */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
              id="tour-bandeiras"
              className="fixed top-6 left-6 sm:top-10 sm:left-10 z-50 pointer-events-auto flex items-center gap-3"
            >
              <img src="/flags/Flag_of_Angola.svg.png" alt="Bandeira de Angola" className="h-5 w-auto rounded-sm shadow-lg" />
              <img src="/flags/Flag_of_Portugal.svg.webp" alt="Bandeira de Portugal" className="h-5 w-auto rounded-sm shadow-lg" />
              <div className="w-px h-4 bg-white/20 mx-1" />
              <a href="https://www.facebook.com/profile.php?id=100091617683484" target="_blank" rel="noopener noreferrer" title="Facebook"
                className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-colors">
                <Facebook size={13} />
              </a>
              <a href="https://www.instagram.com/sabermais.angola/" target="_blank" rel="noopener noreferrer" title="Instagram"
                className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-colors">
                <Instagram size={13} />
              </a>
            </motion.div>



            <motion.div id="tour-logo" initial={{ opacity: 0, x: "-50%", y: 50 }} animate={{ opacity: 1, x: "-50%", y: 0 }} transition={{ duration: 1.5, delay: 0.5 }} className="absolute bottom-[72px] sm:bottom-12 md:bottom-16 left-1/2 z-50 flex flex-col items-center group w-full max-w-[90vw] md:max-w-[750px] pointer-events-auto" >
              <div className="relative flex flex-col justify-center items-center py-0 cursor-none" onMouseEnter={() => { setIsLogoHovered(true); setIsHovering(true); }} onMouseLeave={() => { setIsLogoHovered(false); setIsHovering(false); }}>
                
                <AnimatePresence>
                  {isLogoHovered && activePhaseIndex === 0 && (
                    profile ? (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -top-20 flex flex-col items-center gap-2 z-50">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-xl shadow-xl transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">Sessão: {profile.first_name || 'Utilizador'}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="text-[8px] uppercase tracking-widest text-white/30 hover:text-red-400 flex items-center gap-1"><LogOut size={10} /> Terminar Sessão</button>
                      </motion.div>
                    ) : null
                  )}

                  {isLogoHovered && EDUCATIONAL_ELEMENTS.map((item, i) => {
                    const angle = (i * 360 / EDUCATIONAL_ELEMENTS.length) * (Math.PI / 180);
                    const maxRadius = window.innerWidth < 768 ? 160 : 350; 
                    return (
                      <motion.div key={i} initial={{ x: 0, y: 0, opacity: 0, scale: 0.1 }} animate={{ x: Math.cos(angle) * maxRadius, y: Math.sin(angle) * maxRadius, opacity: [0, 1, 0.8, 0], scale: [0.5, 1.5, 2.5] }} transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeOut", delay: (i % 6) * 0.3 }} className="absolute text-white/70 font-mono italic text-[8px] md:text-[11px] pointer-events-none mix-blend-screen whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" >{item}</motion.div>
                    );
                  })}
                </AnimatePresence>

                <motion.div onClick={() => goToPhase(0)} className="relative z-10 flex justify-center items-center flex-col animate-float outline-none" animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                  <img src="/logo-sabermais.png" alt="Logotipo Saber Mais" className="relative h-16 sm:h-40 md:h-52 w-auto object-contain transition-transform duration-1000 group-hover:scale-105 pointer-events-auto cursor-pointer mix-blend-screen contrast-125 brightness-110" style={{ filter: "drop-shadow(0 0 18px rgba(120,200,255,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.4)) contrast(1.25) brightness(1.1)" }} />
                </motion.div>
              </div>
            </motion.div>

            {/* Barra de navegação mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-auto">
              <div className="flex items-stretch bg-black/60 backdrop-blur-2xl border-t border-white/[0.08]">
                {/* Fase anterior */}
                <button
                  onClick={() => goToPhase(activePhaseIndex - 1)}
                  disabled={activePhaseIndex <= 1}
                  className="flex-1 flex flex-col items-start justify-center px-4 py-3 gap-0.5 disabled:opacity-0 active:bg-white/[0.05] transition-colors"
                >
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-medium">anterior</span>
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wide truncate max-w-[90px]">
                    {activePhaseIndex > 1 ? PROGRAM_PHASES[activePhaseIndex - 1]?.name : ''}
                  </span>
                </button>

                {/* Fase actual — centro */}
                <div className="flex flex-col items-center justify-center px-3 py-2 border-x border-white/[0.08] min-w-[110px]">
                  <span className="text-[8px] uppercase tracking-[0.4em] text-white/40 font-medium">
                    {String(activePhaseIndex).padStart(2,'0')} / {String(PROGRAM_PHASES.length - 1).padStart(2,'0')}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={activePhaseIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] font-bold text-white uppercase tracking-[0.15em] mt-0.5"
                    >
                      {PROGRAM_PHASES[activePhaseIndex]?.name}
                    </motion.span>
                  </AnimatePresence>
                  {profile && (
                    <a
                      href="/dashboard"
                      className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] font-bold uppercase tracking-[0.25em] text-blue-300 hover:bg-blue-500/30 transition-colors"
                    >
                      <LayoutDashboard size={10} />
                      Backoffice
                    </a>
                  )}
                </div>

                {/* Fase seguinte */}
                <button
                  onClick={() => goToPhase(activePhaseIndex + 1)}
                  disabled={activePhaseIndex >= PROGRAM_PHASES.length - 1}
                  className="flex-1 flex flex-col items-end justify-center px-4 py-3 gap-0.5 disabled:opacity-0 active:bg-white/[0.05] transition-colors"
                >
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-medium">seguinte</span>
                  <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wide truncate max-w-[90px] text-right">
                    {activePhaseIndex < PROGRAM_PHASES.length - 1 ? PROGRAM_PHASES[activePhaseIndex + 1]?.name : ''}
                  </span>
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVIPWelcomeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[300] flex flex-col items-center justify-center text-center p-6 pointer-events-auto">
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.99, filter: "blur(15px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
              <motion.img src="/logo-sabermais.png" alt="Saber Mais" animate={{ scale: [1, 1.04, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ repeat: Infinity, duration: 4 }} className="h-20 w-auto object-contain mb-8 select-none mix-blend-screen contrast-125 brightness-110" style={{ filter: "drop-shadow(0 0 24px rgba(120,200,255,0.7)) drop-shadow(0 0 8px rgba(255,255,255,0.5)) contrast(1.25) brightness(1.1)" }} />
              <h2 className="text-5xl font-extralight uppercase tracking-tighter text-white italic leading-none">Bem-vindo</h2>
              <h3 className="text-3xl font-bold uppercase tracking-tight text-blue-500 mt-3 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">{finalFullName}</h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}