"use client";

import { useEffect, useState } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Users, Loader2, Plus, X, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

const ROLE_LABEL: Record<string, string> = {
  "super-admin": "Super Admin", admin: "Administrador", formador: "Formador", formando: "Formando",
};

const STATUS_STYLE: Record<string, string> = {
  activo: "bg-emerald-500/10 text-emerald-400",
  aprovado: "bg-emerald-500/10 text-emerald-400",
  pendente: "bg-amber-500/10 text-amber-400",
  inactivo: "bg-white/5 text-white/30",
};

export default function UtilizadoresPage() {
  const { user: currentUser } = useAdminUser();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("formando");

  // Só admin e super-admin podem criar utilizadores
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super-admin";

  async function fetchUsers() {
    const res = await fetch("/api/db/profiles?orderBy=created_at&ascending=false");
    const { data } = await res.json();
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  function resetForm() {
    setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setRole("formando");
    setShowPassword(false);
  }

  function closeModal() { setIsModalOpen(false); resetForm(); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !firstName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, role }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao criar utilizador.");
      setMessage({ type: "success", text: `${firstName} criado com sucesso.` });
      setTimeout(() => setMessage(null), 4000);
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 w-full">

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 px-5 py-3 rounded-xl flex items-center gap-3 shadow-xl border text-sm ${
          message.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Utilizadores</h2>
          <p className="text-sm text-white/40 mt-0.5">{users.length} utilizador{users.length !== 1 ? "es" : ""} registado{users.length !== 1 ? "s" : ""}.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors shrink-0"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Novo utilizador</span><span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users size={22} className="text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white">Sem utilizadores</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Utilizador</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden sm:table-cell">Cargo</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden md:table-cell">Estado</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3 hidden lg:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                  const initial = name !== "—" ? name[0].toUpperCase() : "?";
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="text-white/80 font-medium">{name}</p>
                            <p className="text-[10px] text-white/30">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/40 hidden sm:table-cell">{ROLE_LABEL[u.role] ?? u.role ?? "—"}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${STATUS_STYLE[u.status] ?? "bg-white/5 text-white/30"}`}>
                          {u.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white/40 hidden lg:table-cell">
                        {u.created_at ? formatDate(u.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — só chega aqui se isAdmin */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-blue-400" /> Novo utilizador
              </h3>
              <button onClick={closeModal} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Nome próprio *</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Ex: João"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Apelido</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">E-mail *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="utilizador@sabermais.ao"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Palavra-passe *</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Cargo</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50">
                  <option value="formando" className="bg-[#0d0d14]">Formando</option>
                  <option value="formador" className="bg-[#0d0d14]">Formador</option>
                  <option value="admin" className="bg-[#0d0d14]">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Criar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
