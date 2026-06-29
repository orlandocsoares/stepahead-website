"use client";

import { useState, useEffect } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Settings, Plus, Pencil, Trash2, Check, X, Loader2, BookOpen, Users2, ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Disciplina = { id: string; nome: string; activo: boolean; ordem: number };
type Grupo = { id: string; nome: string; activo: boolean; criado_at: string };

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

  const [tab, setTab] = useState<"disciplinas" | "grupos">("disciplinas");
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
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
    Promise.all([
      fetch("/api/admin/disciplinas").then(r => r.json()),
      fetch("/api/admin/grupos-formacao").then(r => r.json()),
    ]).then(([d, g]) => {
      setDisciplinas(d.disciplinas ?? []);
      setGrupos(g.grupos ?? []);
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
    if (!confirm("Eliminar esta disciplina? Os ficheiros associados perderão a disciplina.")) return;
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

  async function toggleGrupo(id: string, activo: boolean) {
    setSavingId(id);
    const res = await fetch("/api/admin/grupos-formacao", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, activo }) });
    const json = await res.json();
    setGrupos(prev => prev.map(g => g.id === id ? json.grupo : g));
    setSavingId(null);
  }

  async function renameGrupo(id: string, nome: string) {
    setSavingId(id);
    const res = await fetch("/api/admin/grupos-formacao", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nome }) });
    const json = await res.json();
    setGrupos(prev => prev.map(g => g.id === id ? json.grupo : g));
    setEditingId(null);
    setSavingId(null);
  }

  async function deleteGrupo(id: string) {
    if (!confirm("Eliminar este grupo? Os ficheiros associados perderão o grupo.")) return;
    await fetch(`/api/admin/grupos-formacao?id=${id}`, { method: "DELETE" });
    setGrupos(prev => prev.filter(g => g.id !== id));
  }

  async function addGrupo() {
    if (!newNome.trim()) return;
    setAdding(true);
    const res = await fetch("/api/admin/grupos-formacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: newNome }) });
    const json = await res.json();
    setGrupos(prev => [...prev, json.grupo]);
    setNewNome("");
    setAdding(false);
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b c-br shrink-0">
        <Settings size={17} className="text-blue-400" />
        <h1 className="text-sm font-semibold c-tx">Configurações</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 shrink-0">
        {([
          { key: "disciplinas", label: "Disciplinas", icon: BookOpen },
          { key: "grupos",      label: "Grupos de Formação", icon: Users2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setNewNome(""); setEditingId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? "bg-blue-600/20 text-blue-400" : "c-tx3 hc-tx2 hc-s1"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="max-w-xl space-y-3">
            {/* Table */}
            <div className="c-s1 border c-br rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b c-br">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest c-tx4">Nome</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest c-tx4 text-center w-20">Activo</th>
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--c-br)" }}>
                  {tab === "disciplinas" ? disciplinas.map(d => (
                    <tr key={d.id} className={`transition-colors ${!d.activo ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        {editingId === d.id
                          ? <InlineEdit value={d.nome} onSave={v => renameDisciplina(d.id, v)} onCancel={() => setEditingId(null)} />
                          : <span className="c-tx2 font-medium">{d.nome}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {savingId === d.id
                          ? <Loader2 size={14} className="animate-spin text-blue-400 mx-auto" />
                          : <Toggle value={d.activo} onChange={v => toggleDisciplina(d.id, v)} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditingId(editingId === d.id ? null : d.id)} className="c-tx4 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => deleteDisciplina(d.id)} className="c-tx4 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : grupos.map(g => (
                    <tr key={g.id} className={`transition-colors ${!g.activo ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        {editingId === g.id
                          ? <InlineEdit value={g.nome} onSave={v => renameGrupo(g.id, v)} onCancel={() => setEditingId(null)} />
                          : <span className="c-tx2 font-medium">{g.nome}</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {savingId === g.id
                          ? <Loader2 size={14} className="animate-spin text-blue-400 mx-auto" />
                          : <Toggle value={g.activo} onChange={v => toggleGrupo(g.id, v)} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditingId(editingId === g.id ? null : g.id)} className="c-tx4 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => deleteGrupo(g.id)} className="c-tx4 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row */}
            <div className="flex gap-2">
              <input value={newNome} onChange={e => setNewNome(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (tab === "disciplinas" ? addDisciplina() : addGrupo())}
                placeholder={tab === "disciplinas" ? "Nova disciplina..." : "Novo grupo (ex: Formação 1)..."}
                className="flex-1 c-s1 border c-br rounded-lg px-3 py-2 text-sm c-tx c-ph outline-none focus:border-blue-500/50 transition-colors" />
              <button
                onClick={tab === "disciplinas" ? addDisciplina : addGrupo}
                disabled={adding || !newNome.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors">
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Adicionar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
