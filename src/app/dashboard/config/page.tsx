"use client";

import { useState, useEffect } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Settings, Plus, Pencil, Trash2, Check, X, Loader2, BookOpen, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Disciplina = { id: string; nome: string; activo: boolean; ordem: number };

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="transition-colors">
      {value
        ? <ToggleRight size={22} className="text-blue-400" />
        : <ToggleLeft size={22} className="c-tx5" />}
    </button>
  );
}

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-2 flex-1">
      <input autoFocus value={v} onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSave(v); if (e.key === "Escape") onCancel(); }}
        className="flex-1 c-s2 border c-br rounded-lg px-2 py-1 text-sm c-tx outline-none focus:border-blue-500/50" />
      <button onClick={() => onSave(v)} className="text-blue-400 hover:text-blue-300 transition-colors"><Check size={14} /></button>
      <button onClick={onCancel} className="c-tx4 hc-tx transition-colors"><X size={14} /></button>
    </div>
  );
}

export default function ConfigPage() {
  const { user } = useAdminUser();
  const router = useRouter();
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNome, setNewNome] = useState("");
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard");
  }, [user, isAdmin]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/disciplinas").then(r => r.json()).then(d => {
      setDisciplinas(d.disciplinas ?? []);
      setLoading(false);
    });
  }, []);

  async function toggleDisciplina(id: string, activo: boolean) {
    setSavingId(id);
    const res = await fetch("/api/admin/disciplinas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, activo }) });
    const json = await res.json();
    setDisciplinas(prev => prev.map(d => d.id === id ? json.disciplina : d));
    setSavingId(null);
  }

  async function renameDisciplina(id: string, nome: string) {
    setSavingId(id);
    const res = await fetch("/api/admin/disciplinas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nome }) });
    const json = await res.json();
    setDisciplinas(prev => prev.map(d => d.id === id ? json.disciplina : d));
    setEditingId(null);
    setSavingId(null);
  }

  async function deleteDisciplina(id: string) {
    if (!confirm("Eliminar esta área? Os ficheiros associados perderão a área.")) return;
    await fetch(`/api/admin/disciplinas?id=${id}`, { method: "DELETE" });
    setDisciplinas(prev => prev.filter(d => d.id !== id));
  }

  async function addDisciplina() {
    if (!newNome.trim()) return;
    setAdding(true);
    const res = await fetch("/api/admin/disciplinas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: newNome }) });
    const json = await res.json();
    setDisciplinas(prev => [...prev, json.disciplina]);
    setNewNome("");
    setAdding(false);
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 w-full">
      {/* Voltar */}
      <a href="/dashboard/ficheiros" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg c-bg2 border c-br text-xs font-medium c-tx3 hover:c-tx hc-s2 transition-colors w-fit">
        <ArrowLeft size={13} />
        Voltar ao Repositório
      </a>

      {/* Header */}
      <div className="c-bg2 border c-br rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Settings size={16} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold c-tx">Configurações</h1>
          <p className="text-[11px] c-tx4">Áreas do repositório</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">

          {/* ── Áreas ── */}
          <div id="tour-config-areas" className="c-bg2 border c-br rounded-xl overflow-hidden flex flex-col max-w-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b c-br">
              <BookOpen size={14} className="text-blue-400" />
              <h2 className="text-xs font-semibold c-tx uppercase tracking-wider">Áreas</h2>
              <span className="ml-auto text-[10px] c-tx5">{disciplinas.length} áreas</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y" style={{ borderColor: "var(--c-br)" }}>
                  {disciplinas.map(d => (
                    <tr key={d.id} className={`transition-colors ${!d.activo ? "opacity-40" : ""}`}>
                      <td className="px-4 py-2.5">
                        {editingId === d.id
                          ? <InlineEdit value={d.nome} onSave={v => renameDisciplina(d.id, v)} onCancel={() => setEditingId(null)} />
                          : <span className="c-tx2 text-xs font-medium">{d.nome}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center w-14">
                        {savingId === d.id
                          ? <Loader2 size={13} className="animate-spin text-blue-400 mx-auto" />
                          : <Toggle value={d.activo} onChange={v => toggleDisciplina(d.id, v)} />}
                      </td>
                      <td className="px-3 py-2.5 w-16">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => setEditingId(editingId === d.id ? null : d.id)} className="c-tx4 hover:text-blue-400 transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => deleteDisciplina(d.id)} className="c-tx4 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 p-3 border-t c-br">
              <input value={newNome} onChange={e => setNewNome(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDisciplina()}
                placeholder="Nova área..."
                className="flex-1 c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx c-ph outline-none focus:border-blue-500/50 transition-colors" />
              <button onClick={addDisciplina} disabled={adding || !newNome.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-xs text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors">
                <Plus size={13} /> Adicionar
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
