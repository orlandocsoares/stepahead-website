"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Trash2, Calendar, FileText,
  BarChart3, Loader2, Key, Plus, Clock, X, MapPin, Target,
  Users, Activity, Database, Search, User, Download, Pencil
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";

export default function SuperAdminPage() {
  const { user: profile, loading: profileLoading } = useAdminUser();
  const [activeTab, setActiveTab] = useState<"users" | "agenda" | "arquivos" | "stats">("users");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [agendaForm, setAgendaForm] = useState({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
  const [powerForm, setPowerForm] = useState({ poder: "", data_expiracao: "" });
  const [exportFilters, setExportFilters] = useState({ role: "all", period: "all", startDate: "", endDate: "" });

  // Edição de agenda/ficheiros
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});



  const isAdminOrSuper = (role?: string) => role === "admin" || role === "super-admin";

  const isPowerActive = useMemo(() => {
    if (!profile) return false;
    return isAdminOrSuper(profile.role);
  }, [profile]);

  const visibleTabs = useMemo(() => {
    if (isAdminOrSuper(profile?.role)) return ["users", "agenda", "arquivos", "stats"] as const;
    return [] as const;
  }, [profile]);

  useEffect(() => {
    if (!profileLoading && !isAdminOrSuper(profile?.role)) {
      router.push("/dashboard");
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (isAdminOrSuper(profile?.role)) fetchData();
  }, [activeTab, profile]);

  async function fetchData() {
    setLoading(true);
    setDbError(null);
    setSearchTerm("");

    const table = activeTab === "users" ? "profiles" :
                  activeTab === "agenda" ? "agenda_atividades" :
                  activeTab === "arquivos" ? "arquivos" : "dashboard_stats";

    try {
      const res = await fetch(`/api/db/${table}`);
      const { data: res_data, error } = await res.json();
      if (error) { setDbError(error); setData([]); }
      else {
        const sorted = [...(res_data ?? [])].sort((a, b) => {
          const dA = a.created_at || a.updated_at || "";
          const dB = b.created_at || b.updated_at || "";
          return dB.localeCompare(dA);
        });
        setData(sorted);
      }
    } catch (e: any) { setDbError(e.message); setData([]); }
    setLoading(false);
  }

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const s = searchTerm.toLowerCase();
    return data.filter(item => {
      if (activeTab === "users") {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        return fullName.includes(s) || item.email?.toLowerCase().includes(s);
      }
      if (activeTab === "agenda") return item.titulo?.toLowerCase().includes(s) || item.local?.toLowerCase().includes(s);
      if (activeTab === "arquivos") return item.label?.toLowerCase().includes(s) || item.area?.toLowerCase().includes(s);
      return true;
    });
  }, [data, searchTerm, activeTab]);

  const groupedUsers = useMemo(() => {
    if (activeTab !== "users") return null;
    return [
      { title: "Super Admins", data: filteredData.filter(u => u.role === "super-admin"), color: "text-purple-400" },
      { title: "Administradores", data: filteredData.filter(u => u.role === "admin"), color: "text-red-400" },
      { title: "Formadores Oficiais", data: filteredData.filter(u => u.role === "formador"), color: "text-blue-400" },
      { title: "Formandos Inscritos", data: filteredData.filter(u => u.role === "formando"), color: "text-emerald-400" },
    ];
  }, [filteredData, activeTab]);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      let url = "/api/db/profiles?";
      if (exportFilters.role !== "all") url += `eq.role=${exportFilters.role}&`;

      const now = new Date();
      let startDate: Date | null = null;
      if (exportFilters.period === "monthly") startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      else if (exportFilters.period === "quarterly") startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      else if (exportFilters.period === "semi-annual") startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      else if (exportFilters.period === "annual") startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      else if (exportFilters.period === "custom") {
        if (exportFilters.startDate) startDate = new Date(exportFilters.startDate);
        if (exportFilters.endDate) url += `lte.created_at=${new Date(exportFilters.endDate).toISOString()}&`;
      }
      if (startDate) url += `gte.created_at=${startDate.toISOString()}&`;

      const res = await fetch(url);
      const { data: exportData } = await res.json();
      if (!exportData?.length) { alert("Nenhum dado encontrado para os filtros seleccionados."); return; }

      const headersMap: Record<string, string> = {
        first_name: "Nome Proprio", last_name: "Apelido", email: "E-mail", role: "Cargo", status: "Estatuto",
        province: "Provincia", specialization: "Especialidade", biografia: "Biografia", created_at: "Data Registo"
      };
      const keys = Object.keys(headersMap);
      const csvRows = [
        keys.map(k => headersMap[k]).join(";"),
        ...exportData.map((row: any) => keys.map(k => {
          let val = row[k];
          if (k === "created_at" && val) val = new Date(val).toLocaleDateString("pt-PT");
          return `"${(val ?? "").toString().replace(/"/g, '""')}"`;
        }).join(";")),
      ];
      const blob = new Blob(["﻿" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url2 = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url2; link.download = `Relatorio_Agentes_${exportFilters.period}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url2);
      setIsExportModalOpen(false);
    } catch (err: any) { alert("Erro na exportação: " + err.message); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (id: string, updates: any, closePowerModal = false) => {
    const table = activeTab === "users" ? "profiles" : activeTab === "agenda" ? "agenda_atividades" : "arquivos";
    const res = await fetch(`/api/db/${table}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates, eq: { id } }),
    });
    const { error } = await res.json();
    if (!error) { if (closePowerModal) setIsPowerModalOpen(false); fetchData(); }
    else alert("Erro ao actualizar: " + error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirma a eliminação irreversível?")) return;
    const table = activeTab === "users" ? "profiles" : activeTab === "agenda" ? "agenda_atividades" : "arquivos";
    await fetch(`/api/db/${table}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eq: { id } }),
    });
    fetchData();
  };

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/db/agenda_atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agendaForm),
    });
    setIsAgendaModalOpen(false);
    setAgendaForm({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
    fetchData();
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    if (activeTab === "agenda") {
      setEditForm({
        titulo: item.titulo || "",
        local: item.local || "Luanda",
        data_evento: item.data_evento ? item.data_evento.split("T")[0] : "",
        tipo: item.tipo || "Global",
      });
    } else if (activeTab === "arquivos") {
      setEditForm({ label: item.label || "", area: item.area || "Geral" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    await handleUpdate(editItem.id, editForm);
    setEditItem(null);
  };

  const openPowerModal = (user: any) => {
    setSelectedUser(user);
    setPowerForm({ poder: user.temporary_power || "", data_expiracao: user.power_expires_at ? user.power_expires_at.split("T")[0] : "" });
    setIsPowerModalOpen(true);
  };

  const assignTemporaryPower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    handleUpdate(selectedUser.id, { temporary_power: powerForm.poder || null, power_expires_at: powerForm.data_expiracao || null }, true);
  };

  if (profileLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={40} strokeWidth={1} />
    </div>
  );

  return (
    <div className="h-full flex flex-col w-full relative z-10 selection:bg-blue-500/30 overflow-hidden">

      <style dangerouslySetInnerHTML={{__html: `.hide-native-scroll::-webkit-scrollbar{width:2px}.hide-native-scroll::-webkit-scrollbar-track{background:transparent}.hide-native-scroll::-webkit-scrollbar-thumb{background:transparent}`}} />

      <header className="mb-8 flex flex-col lg:flex-row justify-between items-end gap-6 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Centro de Controlo</h2>
          <p className="text-sm text-white/40 mt-0.5">Administração do sistema.</p>
        </div>
        <div className="flex bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
          {visibleTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow" : "text-white/40 hover:text-white"}`}
            >
              {tab === "users" ? "Utilizadores" : tab === "agenda" ? "Agenda" : tab === "arquivos" ? "Ficheiros" : "Estatísticas"}
            </button>
          ))}
        </div>
      </header>

      {dbError && <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm shrink-0">Erro: {dbError}</div>}

      {activeTab !== "stats" && (
        <div className="mb-5 flex gap-3 items-center shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          {activeTab === "users" && (
            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-sm text-white/60 hover:text-white transition-colors">
              <Download size={14} /> Exportar CSV
            </button>
          )}
          {activeTab === "agenda" && (
            <button onClick={() => setIsAgendaModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
              <Plus size={14} /> Novo evento
            </button>
          )}
        </div>
      )}

      <div className="flex-1 relative flex gap-6 min-h-0">
        <div className="flex-1 overflow-y-auto hide-native-scroll pb-6 pr-2">
          <AnimatePresence mode="wait">
            {activeTab === "stats" ? (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, color: "bg-blue-500/10 text-blue-400", label: "total_users", title: "Utilizadores Activos", default: "—" },
                  { icon: ShieldCheck, color: "bg-emerald-500/10 text-emerald-400", label: "approval_rate", title: "Saúde da Rede", default: "—" },
                  { icon: Calendar, color: "bg-amber-500/10 text-amber-400", label: "event_engagement", title: "Taxa de Presença", default: "—" },
                  { icon: Database, color: "bg-purple-500/10 text-purple-400", label: "total_files", title: "Activos Digitais", default: "—" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}><kpi.icon size={18} /></div>
                    <p className="text-xs text-white/40">{kpi.title}</p>
                    <p className="text-2xl font-semibold text-white">{data.find(d => d.label === kpi.label)?.valor || kpi.default}</p>
                  </div>
                ))}
              </motion.div>
            ) : activeTab === "users" && groupedUsers ? (
              <motion.div key="users_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                {groupedUsers.map((group) => {
                  if (group.data.length === 0) return null;
                  return (
                    <div key={group.title} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${group.color}`}>{group.title}</h3>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-xs text-white/20">{group.data.length}</span>
                      </div>
                      <div className="space-y-2">
                        {group.data.map((item, index) => {
                          const name = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Sem nome";
                          return (
                            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                              className="bg-[#13131f] border border-white/[0.06] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-white/[0.12] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                                  {(item.first_name?.[0] || "?").toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{name}</p>
                                  <p className="text-xs text-white/30">{item.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <select value={item.role} onChange={(e) => handleUpdate(item.id, { role: e.target.value })}
                                  className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 outline-none cursor-pointer"
                                >
                                  <option value="formando" className="bg-[#0d0d14]">Formando</option>
                                  <option value="formador" className="bg-[#0d0d14]">Formador</option>
                                  <option value="admin" className="bg-[#0d0d14]">Admin</option>
                                </select>
                                <select value={item.status || "aprovado"} onChange={(e) => handleUpdate(item.id, { status: e.target.value })}
                                  className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 outline-none cursor-pointer"
                                >
                                  <option value="pendente" className="bg-[#0d0d14]">Pendente</option>
                                  <option value="aprovado" className="bg-[#0d0d14]">Aprovado</option>
                                </select>
                                <button onClick={() => openPowerModal(item)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors ${item.temporary_power ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.04] text-white/30 hover:text-white"}`}>
                                  <Clock size={11} /> {item.temporary_power ? "Poder activo" : "Poder"}
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="generic_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {filteredData.map((item, index) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                    className="bg-[#13131f] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between gap-4 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.titulo || item.label || "Registo"}</p>
                      <p className="text-xs text-white/30">
                        {activeTab === "agenda" && `${item.local} · ${new Date(item.data_evento).toLocaleDateString("pt-PT")}`}
                        {activeTab === "arquivos" && `${item.area} · ${item.tamanho || "—"}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {filteredData.length === 0 && !loading && (
                  <div className="py-16 text-center text-sm text-white/20">
                    {searchTerm ? `Sem resultados para "${searchTerm}".` : "Tabela vazia."}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* MODAL: EDIÇÃO de agenda ou ficheiro */}
      {editItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditItem(null)} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Pencil size={15} className="text-blue-400" />
                {activeTab === "agenda" ? "Editar evento" : "Editar ficheiro"}
              </h3>
              <button onClick={() => setEditItem(null)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4">
              {activeTab === "agenda" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Título</label>
                    <input required value={editForm.titulo} onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/40">Local</label>
                      <select value={editForm.local} onChange={e => setEditForm({...editForm, local: e.target.value})}
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                        {["Luanda","Bié","Online"].map(l => <option key={l} className="bg-[#0d0d14]">{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/40">Data</label>
                      <input required type="date" value={editForm.data_evento} onChange={e => setEditForm({...editForm, data_evento: e.target.value})}
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Âmbito</label>
                    <select value={editForm.tipo} onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                      <option value="Global" className="bg-[#0d0d14]">Global</option>
                      <option value="Restrito" className="bg-[#0d0d14]">Restrito</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === "arquivos" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Nome do ficheiro</label>
                    <input required value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Área</label>
                    <select value={editForm.area} onChange={e => setEditForm({...editForm, area: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                      {["Geral","Matemática","Língua Portuguesa","Física","Química","Pedagogia"].map(a => (
                        <option key={a} className="bg-[#0d0d14]">{a}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">Guardar alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGENDA */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAgendaModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><Calendar size={16} className="text-blue-400" /> Novo evento</h3>
              <button onClick={() => setIsAgendaModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAgenda} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Título</label>
                <input required value={agendaForm.titulo} onChange={(e) => setAgendaForm({...agendaForm, titulo: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Local</label>
                  <select value={agendaForm.local} onChange={(e) => setAgendaForm({...agendaForm, local: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                    {["Luanda","Bié","Online"].map(l => <option key={l} className="bg-[#0d0d14]">{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Data</label>
                  <input required type="date" value={agendaForm.data_evento} onChange={(e) => setAgendaForm({...agendaForm, data_evento: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Âmbito</label>
                <select value={agendaForm.tipo} onChange={(e) => setAgendaForm({...agendaForm, tipo: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  <option value="Global" className="bg-[#0d0d14]">Global</option>
                  <option value="Restrito" className="bg-[#0d0d14]">Restrito</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsAgendaModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PODERES TEMPORÁRIOS */}
      {isPowerModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPowerModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2"><Target size={16} className="text-amber-400" /> Poder Temporário</h3>
                <p className="text-xs text-white/30 mt-1">{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              <button onClick={() => setIsPowerModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={assignTemporaryPower} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Privilégio (vazio para remover)</label>
                <input type="text" value={powerForm.poder} onChange={(e) => setPowerForm({...powerForm, poder: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" placeholder="Ex: Gestor_Agenda" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Expira em</label>
                <input type="date" value={powerForm.data_expiracao} onChange={(e) => setPowerForm({...powerForm, data_expiracao: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsPowerModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-amber-500 text-sm text-black font-medium hover:bg-amber-400 transition-colors">Autorizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPORTAR CSV */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsExportModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><Download size={16} className="text-blue-400" /> Exportação CSV</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Cargo</label>
                <select value={exportFilters.role} onChange={(e) => setExportFilters({...exportFilters, role: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  <option value="all" className="bg-[#0d0d14]">Todos</option>
                  <option value="admin" className="bg-[#0d0d14]">Administradores</option>
                  <option value="formador" className="bg-[#0d0d14]">Formadores</option>
                  <option value="formando" className="bg-[#0d0d14]">Formandos</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Período</label>
                <select value={exportFilters.period} onChange={(e) => setExportFilters({...exportFilters, period: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  <option value="all" className="bg-[#0d0d14]">Histórico Total</option>
                  <option value="monthly" className="bg-[#0d0d14]">Mensal</option>
                  <option value="quarterly" className="bg-[#0d0d14]">Trimestral</option>
                  <option value="semi-annual" className="bg-[#0d0d14]">Semestral</option>
                  <option value="annual" className="bg-[#0d0d14]">Anual</option>
                  <option value="custom" className="bg-[#0d0d14]">Data específica</option>
                </select>
              </div>
              {exportFilters.period === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Início</label>
                    <input type="date" value={exportFilters.startDate} onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Fim</label>
                    <input type="date" value={exportFilters.endDate} onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setIsExportModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button onClick={handleExportCSV} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                  <Download size={13} /> Descarregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
