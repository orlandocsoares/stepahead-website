"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, X, BookOpen, Loader2, ExternalLink, LayoutDashboard } from "lucide-react";
import { HeroBranding } from "@/components/HeroBranding";
import { isBrandedCapa } from "@/lib/capas";

type Recurso = {
  id: string;
  label: string;
  area: string;
  tamanho?: string;
  created_at: string;
  thumbnail_url?: string;
  nome_arquivo?: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

const AREA_COLORS: Record<string, string> = {
  "Língua Portuguesa": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Matemática":        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Pedagogia":         "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Ciências":          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "História":          "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Geografia":         "bg-lime-500/10 text-lime-400 border-lime-500/20",
  "Física":            "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Química":           "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Geral":             "bg-white/5 text-white/60 border-white/10",
};
const AREA_ACCENT: Record<string, string> = {
  "Língua Portuguesa": "#10b981",
  "Matemática":        "#3b82f6",
  "Pedagogia":         "#8b5cf6",
  "Ciências":          "#06b6d4",
  "História":          "#f59e0b",
  "Geografia":         "#84cc16",
  "Física":            "#a855f7",
  "Química":           "#ec4899",
  "Geral":             "#6b7280",
};
const DEFAULT_COLOR = "bg-white/5 text-white/60 border-white/10";

type Profile = { first_name?: string; last_name?: string; avatar_url?: string };

function RecursosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const areaFiltro = searchParams.get("area") ?? null;

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Recurso | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setProfile(d ?? null)).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/recursos")
      .then(r => r.json())
      .then(j => setRecursos(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar por área se vier query param
  const recursosFiltrados = useMemo(() => {
    if (!areaFiltro) return recursos;
    return recursos.filter(r => (r.area || "Geral") === areaFiltro);
  }, [recursos, areaFiltro]);

  // Agrupar por área
  const grupos = useMemo(() => {
    const map: Record<string, Recurso[]> = {};
    for (const r of recursosFiltrados) {
      const key = r.area || "Geral";
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [recursosFiltrados]);

  return (
    <>
    <style>{`
      @keyframes border-spin {
        from { --angle: 0deg; }
        to   { --angle: 360deg; }
      }
      @property --angle {
        syntax: '<angle>';
        initial-value: 0deg;
        inherits: false;
      }
      .border-spin {
        animation: border-spin 2.8s linear infinite;
        background: conic-gradient(
          from var(--angle),
          transparent 70%,
          rgba(255,255,255,0.9) 85%,
          rgba(255,255,255,1) 90%,
          rgba(255,255,255,0.9) 95%,
          transparent 100%
        );
      }
    `}</style>
    <div className="min-h-screen text-white overflow-y-auto relative"
      style={{ backgroundImage: "url('/modos/meio-escuro.webp')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      {/* Overlay escuro para legibilidade */}
      <div className="fixed inset-0 bg-[#080c1a]/70 pointer-events-none z-0" />
      {/* Botões fixos topo direito — igual à home */}
      <div className="fixed top-5 right-4 sm:right-6 md:right-10 z-40 flex items-center gap-2">
        {profile ? (
          <>
            <button
              onClick={() => router.push("/dashboard/perfil")}
              className="relative w-10 h-10 rounded-full border border-white/20 bg-slate-950/80 overflow-hidden hover:border-white/50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              title={profile.first_name || "Perfil"}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-white/80 uppercase">
                  {(profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "")}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-white/20 bg-slate-950/80 text-white/80 text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:border-blue-400/60 hover:bg-slate-900/95 hover:text-white shadow-[0_0_20px_rgba(59,130,246,0.18)]"
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>
          </>
        ) : (
          <>
            <a href="/login"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-white/20 bg-slate-950/80 text-white/80 text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:border-white/40 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]">
              Entrar
            </a>
            <a href="/register"
              className="inline-flex items-center px-4 h-10 rounded-full border border-blue-500/60 bg-blue-600/80 text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              Área reservada
            </a>
          </>
        )}
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Título */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-blue-400" />
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">Materiais pedagógicos</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
            {areaFiltro && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${AREA_COLORS[areaFiltro] ?? DEFAULT_COLOR}`}>
                {areaFiltro}
              </span>
            )}
          </div>
          <p className="text-white/40 text-sm max-w-xl mt-2">
            {areaFiltro
              ? `Documentos disponíveis em ${areaFiltro}.`
              : "Materiais pedagógicos disponibilizados pela plataforma Saber Mais. Clica em qualquer documento para o consultar."}
          </p>
          {areaFiltro && (
            <a href="/recursos" className="inline-flex items-center gap-1 mt-3 text-xs text-white/30 hover:text-white/60 transition-colors">
              ← Ver todas as disciplinas
            </a>
          )}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-32 gap-2 text-white/30">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">A carregar materiais...</span>
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-white/20">
            <FileText size={40} strokeWidth={1} />
            <p className="text-sm">
              {areaFiltro
                ? `Ainda não existem documentos disponíveis em ${areaFiltro}.`
                : "Nenhum material disponível de momento."}
            </p>
            {areaFiltro && (
              <a href="/recursos" className="text-xs text-white/30 hover:text-white/50 transition-colors mt-1">
                Ver todas as disciplinas →
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {grupos.map(([area, items]) => {
              const colorClass = AREA_COLORS[area] ?? DEFAULT_COLOR;
              return (
                <section key={area}>
                  {/* Cabeçalho da disciplina */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
                      {area}
                    </span>
                    <span className="text-xs text-white/25">{items.length} documento{items.length !== 1 ? "s" : ""}</span>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>

                  {/* Grelha de ficheiros com miniatura */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(r => {
                      const accent = AREA_ACCENT[r.area] ?? "#6b7280";
                      const fileUrl = r.nome_arquivo
                        ? `/storage/v1/object/public/materiais/${encodeURIComponent(r.nome_arquivo)}`
                        : null;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setViewing(r)}
                          className="flex flex-col rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/25 hover:shadow-xl transition-all text-left group overflow-hidden"
                        >
                          {/* Barra de cor da disciplina */}
                          <div className="h-0.5 w-full shrink-0" style={{ background: accent }} />

                          {/* Miniatura */}
                          <div className={`w-full aspect-[2/3] flex items-center justify-center relative overflow-hidden ${r.thumbnail_url ? "bg-white" : "bg-black/30"}`}>
                            {r.thumbnail_url ? (
                              <>
                                <img src={r.thumbnail_url} alt={r.label} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                {isBrandedCapa(r.thumbnail_url) && (
                                  <p className="absolute left-[6%] right-[6%] top-[42%] bg-white/85 backdrop-blur-sm shadow-sm rounded-md px-2 py-1.5 text-slate-800 font-semibold leading-tight line-clamp-2 text-[9px] sm:text-[10px] md:text-xs">
                                    {r.label}
                                  </p>
                                )}
                              </>
                            ) : fileUrl ? (
                              <embed src={fileUrl} type="application/pdf" className="w-full h-full pointer-events-none" />
                            ) : (
                              <div className="flex flex-col items-center gap-2 opacity-25">
                                <FileText size={36} strokeWidth={1} className="text-red-400" />
                                <span className="text-[10px] text-white/50 uppercase tracking-widest">PDF</span>
                              </div>
                            )}

                            {/* Badge tipo */}
                            <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-red-400">PDF</span>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-xs text-white font-medium border border-white/20">
                                <ExternalLink size={13} /> Abrir documento
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="px-3 py-3">
                            <p className="text-sm font-medium text-white/90 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                              {r.label}
                            </p>
                            <p className="text-[11px] text-white/30 mt-1.5">
                              {formatDate(r.created_at)}{r.tamanho ? ` · ${r.tamanho}` : ""}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Painel lateral direito — navegação por fases (igual à página principal) */}
      <div className="fixed top-0 right-4 sm:right-6 md:right-10 bottom-0 z-30 hidden md:flex flex-col justify-between items-end py-10 pointer-events-none">
        <div className="shrink-0 h-16" />{/* espaço para o header */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto my-auto">
          {[
            { name: "Saber Mais",     href: "/" },
            { name: "Capacitação",    href: "/" },
            { name: "Par Pedagógico", href: "/" },
            { name: "Luanda & Bié",   href: "/" },
            { name: "Recursos",       href: "/?phase=5", active: true },
            { name: "Monitorização",  href: "/" },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`group relative w-44 md:w-56 h-14 rounded-xl flex items-center justify-center transition-all duration-700 ${item.active ? "scale-[1.03]" : "scale-100 hover:scale-[1.02]"}`}
            >
              {item.active && (
                <div className="absolute -inset-[1px] rounded-xl border-spin z-0 pointer-events-none" style={{ borderRadius: "0.75rem" }} />
              )}
              <div className={`absolute inset-[1px] rounded-[10px] backdrop-blur-xl transition-all duration-700 z-10 ${item.active ? "bg-slate-950/80" : "bg-white/[0.04] group-hover:bg-white/[0.10]"}`} />
              {!item.active && (
                <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/25 transition-all duration-700 z-10 pointer-events-none" />
              )}
              <span className={`relative z-20 text-[11px] md:text-[12px] uppercase tracking-[0.55em] md:tracking-[0.6em] font-medium leading-none transition-all duration-700 truncate px-4 ${item.active ? "text-white font-bold" : "text-white/70 group-hover:text-white/95"}`}>
                {item.name}
              </span>
            </a>
          ))}
        </div>
        <div className="pointer-events-auto shrink-0">
          <HeroBranding />
        </div>
      </div>

      {/* Modal viewer fullscreen */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#08080f]" onContextMenu={e => e.preventDefault()}>
          {/* Barra do viewer */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0d0d14]">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-semibold text-white truncate">{viewing.label}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{viewing.area} · {formatDate(viewing.created_at)}</p>
            </div>
            <button onClick={() => setViewing(null)}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center gap-1.5 text-xs shrink-0">
              <X size={16} /> Fechar
            </button>
          </div>

          {/* PDF via embed — URL directo do storage, sem autenticação para ficheiros públicos */}
          {viewing.nome_arquivo ? (
            <embed
              src={`/storage/v1/object/public/materiais/${encodeURIComponent(viewing.nome_arquivo)}#toolbar=0&navpanes=0`}
              type="application/pdf"
              className="flex-1 w-full"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
              <FileText size={48} strokeWidth={1} />
              <p className="text-sm">Ficheiro não disponível.</p>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

export default function RecursosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center gap-2 text-white/30">
        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
        <span className="text-sm">A carregar...</span>
      </div>
    }>
      <RecursosContent />
    </Suspense>
  );
}
