"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Search, X, GraduationCap, FileText, ClipboardList, User, Loader2, CornerDownLeft } from "lucide-react";
import { useAdminUser } from "@/hooks/useAdminUser";

type Results = {
  acoes: { id: string; designacao: string; estado?: string }[];
  documentos: { id: string; label: string; area?: string }[];
  tarefas: { id: string; titulo: string }[];
  utilizadores: { id: string; first_name: string; last_name?: string; email: string; role: string }[];
};

const EMPTY: Results = { acoes: [], documentos: [], tarefas: [], utilizadores: [] };

export function GlobalSearch() {
  const router = useRouter();
  const { user } = useAdminUser();
  const isStaff = user?.role === "formador" || user?.role === "admin" || user?.role === "super-admin";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(""); setResults(EMPTY); }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(EMPTY); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        setResults(json);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  const totalResults = results.acoes.length + results.documentos.length + results.tarefas.length + results.utilizadores.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Pesquisar (Ctrl+K)"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border c-br c-tx4 hc-tx hc-s2 transition-colors"
      >
        <Search size={15} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg c-bg border c-br rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b c-br">
              <Search size={16} className="c-tx4 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Pesquisar acções, documentos, tarefas, utilizadores..."
                className="flex-1 bg-transparent text-sm c-tx placeholder:c-tx5 outline-none"
              />
              {loading ? <Loader2 size={14} className="animate-spin c-tx4 shrink-0" /> : (
                <button onClick={() => setOpen(false)} className="c-tx5 hc-tx shrink-0"><X size={16} /></button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="text-xs c-tx5 text-center py-10">Escreve pelo menos 2 caracteres para pesquisar.</p>
              ) : !loading && totalResults === 0 ? (
                <p className="text-xs c-tx5 text-center py-10">Sem resultados para "{q}".</p>
              ) : (
                <div className="py-2">
                  {results.acoes.length > 0 && (
                    <ResultGroup label="Acções de Formação">
                      {results.acoes.map(a => (
                        <ResultRow key={a.id} icon={<GraduationCap size={14} className="text-purple-400" />}
                          title={a.designacao} subtitle={a.estado}
                          onClick={() => go(isStaff ? `/dashboard/acoes-formacao?open=${a.id}` : `/dashboard/minhas-formacoes?acao=${a.id}`)} />
                      ))}
                    </ResultGroup>
                  )}
                  {results.documentos.length > 0 && (
                    <ResultGroup label="Documentos">
                      {results.documentos.map(d => (
                        <ResultRow key={d.id} icon={<FileText size={14} className="text-teal-400" />}
                          title={d.label} subtitle={d.area} onClick={() => go(`/dashboard/ficheiros?q=${encodeURIComponent(d.label)}`)} />
                      ))}
                    </ResultGroup>
                  )}
                  {results.tarefas.length > 0 && (
                    <ResultGroup label="Tarefas">
                      {results.tarefas.map(t => (
                        <ResultRow key={t.id} icon={<ClipboardList size={14} className="text-blue-400" />}
                          title={t.titulo} onClick={() => go(`/dashboard/tarefas?q=${encodeURIComponent(t.titulo)}`)} />
                      ))}
                    </ResultGroup>
                  )}
                  {results.utilizadores.length > 0 && (
                    <ResultGroup label="Utilizadores">
                      {results.utilizadores.map(u => (
                        <ResultRow key={u.id} icon={<User size={14} className="text-amber-400" />}
                          title={`${u.first_name} ${u.last_name ?? ""}`.trim()} subtitle={u.email}
                          onClick={() => go(`/dashboard/admin`)} />
                      ))}
                    </ResultGroup>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-t c-br text-[10px] c-tx5">
              <CornerDownLeft size={11} /> abrir <span className="mx-1">·</span> Esc fechar
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="text-[10px] font-bold uppercase tracking-widest c-tx5 px-4 py-1.5">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hc-s2 transition-colors text-left">
      <span className="w-7 h-7 rounded-lg c-s1 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm c-tx2 truncate">{title}</span>
        {subtitle && <span className="block text-[11px] c-tx5 truncate">{subtitle}</span>}
      </span>
    </button>
  );
}
