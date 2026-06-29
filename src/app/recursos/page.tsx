"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { FileText, X, ChevronRight, BookOpen, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";

const PdfViewer = dynamic(() => import("@/components/PdfViewer").then(m => m.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 gap-2 text-white/40 text-sm">
      <Loader2 size={16} className="animate-spin" /> A carregar leitor...
    </div>
  ),
});

type Recurso = {
  id: string;
  label: string;
  area: string;
  tamanho?: string;
  created_at: string;
  thumbnail_url?: string;
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
const DEFAULT_COLOR = "bg-white/5 text-white/60 border-white/10";

function RecursosContent() {
  const searchParams = useSearchParams();
  const areaFiltro = searchParams.get("area") ?? null;

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Recurso | null>(null);

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
    <div className="min-h-screen bg-[#0d0d14] text-white overflow-y-auto">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0d0d14]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/storage/v1/object/public/logo-sabermais/logo.png"
              alt="SaberMais" width={110} height={30}
              className="brightness-0 invert"
            />
          </a>
          <a href="/login"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            Área reservada <ChevronRight size={14} />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
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

                  {/* Lista de ficheiros */}
                  <div className="space-y-2">
                    {items.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setViewing(r)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all text-left group"
                      >
                        {/* Ícone PDF */}
                        <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-red-400" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                            {r.label}
                          </p>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            {formatDate(r.created_at)}{r.tamanho ? ` · ${r.tamanho}` : ""}
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="shrink-0 flex items-center gap-1 text-[11px] text-white/25 group-hover:text-blue-400 transition-colors">
                          <ExternalLink size={13} />
                          <span className="hidden sm:inline">Abrir</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal viewer fullscreen */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#08080f]"
          onContextMenu={e => e.preventDefault()}
        >
          {/* Barra do viewer */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 bg-[#0d0d14]">
            <div className="min-w-0 flex-1 mr-4">
              <p className="text-sm font-semibold text-white truncate">{viewing.label}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{viewing.area} · {formatDate(viewing.created_at)}</p>
            </div>
            <button
              onClick={() => setViewing(null)}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 flex items-center gap-1.5 text-xs"
            >
              <X size={16} /> Fechar
            </button>
          </div>

          {/* PDF */}
          <div className="flex-1 overflow-y-auto flex justify-center py-6 px-4">
            <PdfViewer url={`/api/recursos/pdf/${viewing.id}`} />
          </div>
        </div>
      )}
    </div>
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
