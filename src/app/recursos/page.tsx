"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FileText, X, ChevronRight, BookOpen } from "lucide-react";
import Image from "next/image";

const PdfViewer = dynamic(() => import("@/components/PdfViewer").then(m => m.PdfViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-48 text-slate-400 text-sm">A carregar leitor...</div>,
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

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Todos");
  const [viewing, setViewing] = useState<Recurso | null>(null);

  useEffect(() => {
    fetch("/api/recursos")
      .then(r => r.json())
      .then(j => setRecursos(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const disciplinas = useMemo(() => {
    const areas = [...new Set(recursos.map(r => r.area))].sort();
    return ["Todos", ...areas];
  }, [recursos]);

  const filtered = useMemo(() =>
    activeTab === "Todos" ? recursos : recursos.filter(r => r.area === activeTab),
    [recursos, activeTab]
  );

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0d0d14]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Image src="/storage/v1/object/public/logo-sabermais/logo.png" alt="SaberMais" width={120} height={32} className="brightness-0 invert" />
          </a>
          <a href="/login"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            Área reservada <ChevronRight size={14} />
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Título */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-blue-400" />
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">Materiais pedagógicos</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Recursos</h1>
          <p className="text-white/50 text-sm max-w-xl">
            Consulta os materiais pedagógicos disponibilizados pela plataforma Saber Mais.
          </p>
        </div>

        {/* Tabs de disciplina */}
        {!loading && disciplinas.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {disciplinas.map(d => (
              <button key={d} onClick={() => setActiveTab(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeTab === d
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-white/[0.08] text-white/50 hover:text-white hover:border-white/20"
                }`}>
                {d}
                {d !== "Todos" && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    ({recursos.filter(r => r.area === d).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Grid de documentos */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] h-52 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/30">
            <FileText size={40} strokeWidth={1} />
            <p className="text-sm">Nenhum documento disponível nesta área.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(r => (
              <button key={r.id} onClick={() => setViewing(r)}
                className="group flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left">
                {/* Preview */}
                <div className="relative w-full aspect-[3/4] bg-white/[0.02] overflow-hidden">
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt={r.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={36} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 right-2 text-[9px] font-bold bg-black/60 text-red-400 px-1.5 py-0.5 rounded">PDF</span>
                </div>
                {/* Info */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-xs font-medium text-white/90 line-clamp-2 leading-snug">{r.label}</p>
                  <p className="text-[10px] text-white/35 mt-auto">{r.area} · {formatDate(r.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Modal viewer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          onContextMenu={e => e.preventDefault()}>
          {/* Barra do viewer */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] shrink-0">
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-md">{viewing.label}</p>
              <p className="text-[11px] text-white/40">{viewing.area}</p>
            </div>
            <button onClick={() => setViewing(null)}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors">
              <X size={18} />
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
