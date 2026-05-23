"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Trash2, Calendar, FileText, 
  BarChart3, Loader2, Key, Plus, Clock, X, MapPin, Target,
  Users, Activity, Database, Search, User, Download
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export default function SuperAdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<"users" | "agenda" | "arquivos" | "stats">("users");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const router = useRouter();

  // Estados dos Modais
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // NOVO MODAL
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Formulários e Filtros
  const [agendaForm, setAgendaForm] = useState({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
  const [powerForm, setPowerForm] = useState({ poder: "", data_expiracao: "" });
  const [exportFilters, setExportFilters] = useState({ role: "all", period: "all", startDate: "", endDate: "" });

  // REFINAMENTO UNIFORME: Rastreador de Direcção para a Calha de Néon (Referência Perfil)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current) {
      setScrollDirection('down');
    } else if (currentScrollY < lastScrollY.current) {
      setScrollDirection('up');
    }
    lastScrollY.current = currentScrollY;
  };

  // Validação de Poderes Temporários Ativos
  const isPowerActive = useMemo(() => {
    if (!profile) return false;
    if (profile.role === "super-admin") return true;
    if (!profile.temporary_power) return false;
    if (!profile.power_expires_at) return true;
    return new Date(profile.power_expires_at) > new Date();
  }, [profile]);

  // Gestão Dinâmica de Separadores de acordo com a Autoridade
  const visibleTabs = useMemo(() => {
    if (profile?.role === "super-admin") return ["users", "agenda", "arquivos", "stats"];
    if (!isPowerActive || !profile?.temporary_power) return [];
    
    const power = profile.temporary_power.toLowerCase();
    const tabs: ("users" | "agenda" | "arquivos" | "stats")[] = [];
    
    if (power.includes("agenda") || power.includes("evento")) tabs.push("agenda");
    if (power.includes("recurso") || power.includes("arquivo")) tabs.push("arquivos");
    if (power.includes("user") || power.includes("agente") || power.includes("perfil")) tabs.push("users");
    if (power.includes("estatistica") || power.includes("stats")) tabs.push("stats");
    
    if (power.includes("admin") || power.includes("geral") || power.includes("total")) {
      return ["users", "agenda", "arquivos", "stats"];
    }
    return tabs;
  }, [profile, isPowerActive]);

  // Protecção de Rota Baseada em Permissões
  useEffect(() => {
    if (!profileLoading) {
      const hasAccess = profile?.role === "super-admin" || isPowerActive;
      if (!hasAccess) {
        router.push("/dashboard");
      }
    }
  }, [profile, profileLoading, isPowerActive, router]);

  // Forçar selecção de aba válida para gestores com autoridade limitada
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] as any);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    const hasAccess = profile?.role === "super-admin" || isPowerActive;
    if (hasAccess) fetchData();
  }, [activeTab, profile, isPowerActive]);

  async function fetchData() {
    setLoading(true);
    setDbError(null);
    setSearchTerm(""); 
    
    let table = activeTab === "users" ? "profiles" : 
                activeTab === "agenda" ? "agenda_atividades" : 
                activeTab === "arquivos" ? "arquivos" : "dashboard_stats";
    
    const { data: res, error } = await supabase.from(table).select("*");
    
    if (error) {
      setDbError(error.message);
      setData([]);
    } else if (res) {
      const sorted = [...res].sort((a, b) => {
        const dateA = a.created_at || a.updated_at || "";
        const dateB = b.created_at || b.updated_at || "";
        return dateB.localeCompare(dateA);
      });
      setData(sorted);
    }
    setLoading(false);
  }

  // Lógica de Filtragem Dinâmica Avançada
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const s = searchTerm.toLowerCase();
    return data.filter(item => {
      if (activeTab === "users") {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();
        return (fullName.includes(s) || item.email?.toLowerCase().includes(s));
      }
      if (activeTab === "agenda") {
        return (item.titulo?.toLowerCase().includes(s) || item.local?.toLowerCase().includes(s));
      }
      if (activeTab === "arquivos") {
        return (item.label?.toLowerCase().includes(s) || item.area?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [data, searchTerm, activeTab]);

  // AGRUPAMENTO DE UTILIZADORES
  const groupedUsers = useMemo(() => {
    if (activeTab !== "users") return null;
    
    const superAdmins = filteredData.filter(u => u.role === "super-admin");
    const formadores = filteredData.filter(u => u.role === "formador");
    const formandos = filteredData.filter(u => u.role === "formando");
    
    return [
      { title: "Super Administradores", data: superAdmins, color: "text-red-500" },
      { title: "Formadores Oficiais", data: formadores, color: "text-blue-500" },
      { title: "Formandos Inscritos", data: formandos, color: "text-emerald-500" }
    ];
  }, [filteredData, activeTab]);

  // EXPORTAÇÃO DE RELATÓRIOS EM FORMATO PROFISSIONAL COM FILTROS TEMPORAIS E CARGO
  const handleExportCSV = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*");

      if (exportFilters.role !== "all") query = query.eq("role", exportFilters.role);

      let startDateVal: Date | null = null;
      const now = new Date();

      if (exportFilters.period === "monthly") startDateVal = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      else if (exportFilters.period === "quarterly") startDateVal = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      else if (exportFilters.period === "semi-annual") startDateVal = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      else if (exportFilters.period === "annual") startDateVal = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      else if (exportFilters.period === "custom") {
        if (exportFilters.startDate) startDateVal = new Date(exportFilters.startDate);
        if (exportFilters.endDate) {
          const end = new Date(exportFilters.endDate);
          end.setHours(23, 59, 59, 999);
          query = query.lte("created_at", end.toISOString());
        }
      }

      if (startDateVal) query = query.gte("created_at", startDateVal.toISOString());

      const { data: exportData, error } = await query;
      if (error) throw error;
      if (!exportData || exportData.length === 0) {
        alert("Nenhum dado encontrado para os filtros seleccionados.");
        return;
      }

      const headersMap: Record<string, string> = {
        first_name: "Nome Proprio", last_name: "Apelido", email: "E-mail", role: "Cargo", status: "Estatuto",
        province: "Provincia", specialization: "Especialidade", biografia: "Biografia",
        temporary_power: "Poder Temporario", created_at: "Data Registo"
      };
      const headersKeys = Object.keys(headersMap);

      const csvRows = [
        headersKeys.map(k => headersMap[k]).join(";"),
        ...exportData.map((row: any) =>
          headersKeys.map(key => {
            let val = row[key];
            if (key === "created_at" && val) val = new Date(val).toLocaleDateString("pt-PT");
            const stringified = val === null || val === undefined ? "" : String(val);
            return `"${stringified.replace(/"/g, '""')}"`;
          }).join(";")
        )
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Relatorio_Agentes_${exportFilters.period}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
    } catch (err: any) {
      alert("Erro na exportação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updates: any, isUserPower = false) => {
    let table = activeTab === "users" ? "profiles" : activeTab === "agenda" ? "agenda_atividades" : "arquivos";
    const { error } = await supabase.from(table).update(updates).eq("id", id);
    if (!error) {
      if (isUserPower) setIsPowerModalOpen(false);
      fetchData();
    } else {
      alert("Erro ao actualizar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Aviso de Segurança: Confirma a eliminação irreversível?")) return;
    let table = activeTab === "users" ? "profiles" : activeTab === "agenda" ? "agenda_atividades" : "arquivos";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) fetchData();
  };

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("agenda_atividades").insert([agendaForm]);
    if (!error) {
      setIsAgendaModalOpen(false);
      setAgendaForm({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
      fetchData();
    }
  };

  const openPowerModal = (user: any) => {
    setSelectedUser(user);
    setPowerForm({ 
      poder: user.temporary_power || "", 
      data_expiracao: user.power_expires_at ? user.power_expires_at.split("T")[0] : "" 
    });
    setIsPowerModalOpen(true);
  };

  const assignTemporaryPower = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    handleUpdate(selectedUser.id, { 
      temporary_power: powerForm.poder || null, 
      power_expires_at: powerForm.data_expiracao || null
    }, true);
  };

  if (profileLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={40} strokeWidth={1} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-[1400px] mx-auto pt-24 pb-10 px-10 md:pl-48 relative z-10 selection:bg-blue-500/30 overflow-hidden">
      
      {/* Ocultar a Scrollbar Nativa para deixar brilhar a Calha de Néon */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-native-scroll::-webkit-scrollbar {
          width: 2px;
        }
        .hide-native-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-native-scroll::-webkit-scrollbar-thumb {
          background: transparent;
        }
      `}} />

      {/* HEADER DE COMANDO (Fixo) */}
      <header className="mb-10 flex flex-col lg:flex-row justify-between items-end gap-10 shrink-0">
        <div className="space-y-4 text-left">
          <p className="text-[9px] tracking-[1em] text-blue-500 uppercase font-black italic">Operational Governance</p>
          <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
            Centro de <span className="opacity-40 not-italic font-bold">Controlo</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          {/* MENU DE SEPARADORES FILTRADO POR PODER */}
          <div className="flex bg-black/20 border border-white/10 p-2 rounded-3xl backdrop-blur-md shadow-2xl">
            {visibleTabs.map((tab) => (
              <button 
                key={tab} onClick={() => setActiveTab(tab as any)} 
                className={`px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all duration-500 ${activeTab === tab ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" : "text-white/40 hover:text-white"}`}
              >
                {tab === "users" ? "Agentes" : tab === "arquivos" ? "Recursos" : tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* PAINEL DE ERRO */}
      {dbError && (
        <div className="mb-6 p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-mono shrink-0">
          Erro de Comunicação: {dbError}
        </div>
      )}

      {/* BARRA DE PESQUISA, ACÇÕES E EXPORTAÇÃO (Fixa) */}
      {activeTab !== "stats" && (
        <div className="mb-8 flex flex-col sm:flex-row gap-6 justify-between items-center bg-white/[0.01] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm shrink-0">
          <div className="relative w-full sm:max-w-xs group">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Pesquisar em ${activeTab === 'users' ? 'Agentes' : activeTab === 'agenda' ? 'Agenda' : 'Recursos'}...`}
              className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all duration-500"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            
            {/* BOTÃO PREMIUM DE EXPORTAÇÃO DE BASE DE DADOS (ACIONA O NOVO MODAL) */}
            <AnimatePresence>
              {activeTab === "users" && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-white/[0.02] border border-white/10 text-white text-[10px] uppercase font-black tracking-widest rounded-full hover:bg-white/[0.08] active:scale-95 transition-all shadow-xl border-0"
                >
                  <Download size={14} /> Exportação Oficial
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeTab === "agenda" && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsAgendaModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-[10px] uppercase font-black tracking-widest rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all border-0"
                >
                  <Plus size={16} /> Planear Evento
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* COMPACTAÇÃO INFERIOR: Calha de Scroll e o Cometa */}
      <div className="flex-1 relative flex gap-8 min-h-0">
        
        {/* ÁREA DE SCROLL DOS CONTENTORES DE VIDRO */}
        <div 
          className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2"
          onScroll={handleScroll}
        >
          <AnimatePresence mode="wait">
            {activeTab === "stats" ? (
              /* SECTOR ESTATÍSTICO */
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { icon: Users, color: "blue", label: "total_users", title: "Agentes Activos", default: "1,248", desc: "Total de perfis integrados na base de dados. Mede a escala de expansão do portal." },
                  { icon: ShieldCheck, color: "emerald", label: "approval_rate", title: "Saúde da Rede", default: "94%", desc: "Relação entre contas pendentes e aprovadas. Garante a qualidade e o rigor dos acessos." },
                  { icon: Calendar, color: "amber", label: "event_engagement", title: "Taxa de Presença", default: "82%", desc: "Média de inscrições e presenças efectivas por actividade. Mede a relevância do cronograma." },
                  { icon: Database, color: "purple", label: "total_files", title: "Activos Digitais", default: "4.8 GB", desc: "Volume de documentação no Repositório. Indica o crescimento do saber acumulado." }
                ].map((kpi, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl space-y-6">
                    <div className="flex justify-between items-start">
                      <div className={`p-4 bg-${kpi.color}-500/10 rounded-2xl text-${kpi.color}-400`}><kpi.icon size={24} /></div>
                      {kpi.label === 'approval_rate' && <span className="text-[10px] font-black text-white/20 italic">Pendente: {data.find(d => d.label === "pending")?.valor || "14"}</span>}
                    </div>
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{kpi.title}</h3>
                      <p className="text-4xl font-light text-white italic tracking-tighter">{data.find(d => d.label === kpi.label)?.valor || kpi.default}</p>
                    </div>
                    <p className="text-[9px] leading-relaxed text-white/30 uppercase tracking-widest italic border-t border-white/5 pt-4">{kpi.desc}</p>
                  </div>
                ))}
              </motion.div>
            ) : activeTab === "users" && groupedUsers ? (
              /* LISTAGEM DE AGENTES (AGRUPADA POR HIERARQUIA) */
              <motion.div key="users_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                {groupedUsers.map((group, groupIndex) => {
                  if (group.data.length === 0) return null;
                  return (
                    <div key={group.title} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className={`text-[11px] uppercase tracking-[0.3em] font-black italic ${group.color}`}>
                          {group.title}
                        </h3>
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[10px] text-white/20 font-mono">{group.data.length} registos</span>
                      </div>

                      <div className="space-y-4">
                        {group.data.map((item, index) => {
                          const displayName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Agente Sem Nome";
                          const displayAvatar = item.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=ffffff&textColor=000000`;
                          
                          return (
                            <motion.div 
                              key={item.id} 
                              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                              className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-lg flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-black/40 hover:border-blue-500/30 transition-all duration-700 shadow-xl"
                            >
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center w-full">
                                
                                <div className="col-span-1 flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-black">
                                    <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="space-y-1 relative">
                                    <div className="flex items-center gap-2">
                                      <p className="text-white font-light text-xl uppercase tracking-tighter italic drop-shadow-lg truncate max-w-[150px] lg:max-w-[200px]" title={displayName}>
                                        {displayName}
                                      </p>
                                      {item.temporary_power && (
                                        <span className="relative flex h-2 w-2 shrink-0">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]"></span>
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[8px] text-white/50 uppercase tracking-[0.2em] truncate" title={item.email}>{item.email}</p>
                                  </div>
                                </div>
                                
                                <div className="col-span-3 w-full flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shrink-0">
                                    <Key size={12} className="text-blue-500/50" />
                                    <select 
                                      value={item.role} 
                                      onChange={(e) => handleUpdate(item.id, { role: e.target.value })}
                                      className="bg-transparent text-[9px] uppercase font-black text-blue-400 outline-none cursor-pointer border-0 ring-0 focus:ring-0"
                                    >
                                      <option value="formando" className="bg-zinc-900 text-white">Formando</option>
                                      <option value="formador" className="bg-zinc-900 text-white">Formador</option>
                                      <option value="super-admin" className="bg-zinc-900 text-white">Super Admin</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shrink-0">
                                    <ShieldCheck size={12} className={item.status === 'pendente' ? "text-amber-500/50" : "text-emerald-500/50"} />
                                    <select 
                                      value={item.status || "aprovado"} 
                                      onChange={(e) => handleUpdate(item.id, { status: e.target.value })}
                                      className={`bg-transparent text-[9px] uppercase font-black outline-none cursor-pointer border-0 ring-0 focus:ring-0 ${item.status === 'pendente' ? 'text-amber-400' : 'text-emerald-400'}`}
                                    >
                                      <option value="pendente" className="bg-zinc-900 text-white">Pendente</option>
                                      <option value="aprovado" className="bg-zinc-900 text-white">Aprovado</option>
                                    </select>
                                  </div>

                                  <button 
                                    onClick={() => openPowerModal(item)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] uppercase font-black tracking-widest shrink-0 ${item.temporary_power ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white border-0"}`}
                                  >
                                    <Clock size={12} />
                                    {item.temporary_power ? `Poder: ${item.temporary_power}` : "Atribuir Poder"}
                                  </button>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="mt-6 md:mt-0 p-4 rounded-full text-white/20 hover:text-white hover:bg-red-600 transition-all duration-500 border border-transparent hover:border-red-500/50 shadow-lg shrink-0 group-hover:scale-110"
                              >
                                <Trash2 size={18} strokeWidth={1.5} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              /* LISTAGEM DE AGENDA E ARQUIVOS */
              <motion.div key="generic_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {filteredData.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-lg flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-black/40 hover:border-blue-500/30 transition-all duration-700 shadow-xl"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 items-center w-full">
                      
                      <div className="col-span-1 space-y-1 relative">
                        <p className="text-white font-light text-2xl uppercase tracking-tighter italic drop-shadow-lg truncate">
                          {item.titulo || item.label || item.provincia || "Registo"}
                        </p>
                        <p className="text-[9px] text-blue-400 uppercase tracking-[0.4em] font-black italic">
                          {item.tipo || item.area || "Activo"}
                        </p>
                      </div>
                      
                      <div className="col-span-3 w-full flex flex-wrap items-center gap-6">
                         {activeTab === "agenda" && (
                           <div className="flex items-center gap-6 text-[10px] text-white/70 uppercase tracking-[0.2em] font-mono bg-black/30 px-6 py-3 rounded-xl border border-white/5">
                              <span className="flex items-center gap-2 text-blue-400"><Calendar size={12}/> {new Date(item.data_evento).toLocaleDateString("pt-PT")}</span>
                              <span className="flex items-center gap-2"><MapPin size={12} className="text-white/30"/> {item.local}</span>
                           </div>
                         )}

                         {activeTab === "arquivos" && (
                           <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-mono bg-black/30 px-6 py-3 rounded-xl border border-white/5">
                              Tamanho: {item.tamanho || "N/A"}
                           </div>
                         )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="mt-6 md:mt-0 p-4 rounded-full text-white/20 hover:text-white hover:bg-red-600 transition-all duration-500 border border-transparent hover:border-red-500/50 shadow-lg shrink-0 group-hover:scale-110"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </motion.div>
                ))}

                {filteredData.length === 0 && !loading && !dbError && (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-black/10 backdrop-blur-md">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.5em] italic">
                      {searchTerm ? `Nenhum resultado encontrado para "${searchTerm}"` : 'A tabela seleccionada está vazia.'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Assinatura de Fundo */}
          <div className="mt-20 opacity-20 text-center">
             <p className="text-[7px] uppercase tracking-[2em] font-black italic drop-shadow-md">End of Management Record</p>
          </div>
        </div>

        {/* CALHA DE SCROLL NÉON INTEGRADA (O COMETA - REFERÊNCIA UNIFORMISADA) */}
        <div className="w-[3px] rounded-full bg-white/[0.02] relative overflow-hidden shrink-0 hidden md:block mb-10">
          <motion.div
            key={scrollDirection}
            animate={
              scrollDirection === 'down' 
                ? { top: ['-20%', '120%'] } 
                : { top: ['120%', '-20%'] }
            }
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className={`absolute left-0 w-full h-[15%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${
              scrollDirection === 'down'
                ? 'bg-gradient-to-b from-transparent via-blue-500/80 to-white'
                : 'bg-gradient-to-t from-transparent via-blue-500/80 to-white'
            }`}
          />
        </div>
      </div>

      {/* MODAL: REGISTAR EVENTOS NA AGENDA */}
      <AnimatePresence>
        {isAgendaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAgendaModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-zinc-950/80 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
              <button type="button" onClick={() => setIsAgendaModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors bg-transparent border-0"><X size={20} /></button>
              <h2 className="text-2xl font-light text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3"><Calendar className="text-blue-500"/> Planear Evento</h2>
              <form onSubmit={handleCreateAgenda} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Título do Evento</label>
                  <input required type="text" value={agendaForm.titulo} onChange={e => setAgendaForm({...agendaForm, titulo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Sessão de Capacitação..." />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Local</label>
                    <select value={agendaForm.local} onChange={e => setAgendaForm({...agendaForm, local: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 cursor-pointer border-0">
                      <option className="bg-zinc-900 text-white">Luanda</option>
                      <option className="bg-zinc-900 text-white">Bié</option>
                      <option className="bg-zinc-900 text-white">Online</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Data</label>
                    <input required type="date" value={agendaForm.data_evento} onChange={e => setAgendaForm({...agendaForm, data_evento: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Tipo de Evento</label>
                  <select value={agendaForm.tipo} onChange={e => setAgendaForm({...agendaForm, tipo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 cursor-pointer border-0">
                    <option value="Global" className="bg-zinc-900 text-white">Global (Todos)</option>
                    <option value="Restrito" className="bg-zinc-900 text-white">Restrito (Formadores)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-colors mt-4 border-0">Injetar na Rede</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PROTOCOLO DE AUTORIDADE */}
      <AnimatePresence>
        {isPowerModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPowerModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-zinc-950/80 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
              <button type="button" onClick={() => setIsPowerModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors border-0 bg-transparent"><X size={20} /></button>
              <h2 className="text-2xl font-light text-white uppercase tracking-tighter italic mb-2 flex items-center gap-3"><Target className="text-amber-500"/> Protocolo de Autoridade</h2>
              <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono mb-8">
                Alvo: {selectedUser.first_name} {selectedUser.last_name || ""}
              </p>
              
              <form onSubmit={assignTemporaryPower} className="space-y-6">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Privilégio Específico</label>
                  <input type="text" value={powerForm.poder} onChange={e => setPowerForm({...powerForm, poder: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Ex: Auditor_Bie, Gestor_Recursos, (Vazio p/ remover)" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Expira em (Prazo de Validade)</label>
                  <input type="date" value={powerForm.data_expiracao} onChange={e => setPowerForm({...powerForm, data_expiracao: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 [color-scheme:dark]" />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] border-0">Autorizar Concessão</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOVO MODAL: PROTOCOLO DE EXPORTAÇÃO AVANÇADA (CSV COM FILTROS TEMPORAIS E DE CARGO) */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExportModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-zinc-950/80 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
              <button type="button" onClick={() => setIsExportModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors border-0 bg-transparent"><X size={20} /></button>
              <h2 className="text-2xl font-light text-white uppercase tracking-tighter italic mb-2 flex items-center gap-3"><Download className="text-blue-500"/> Exportação Oficial</h2>
              <p className="text-[10px] text-white/40 tracking-widest uppercase font-mono mb-8">
                Geração de Relatórios Periódicos
              </p>
              
              <div className="space-y-6 text-left">
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Filtrar por Cargo</label>
                  <select 
                    value={exportFilters.role} 
                    onChange={e => setExportFilters({...exportFilters, role: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 cursor-pointer border-0"
                  >
                    <option value="all">Todos os Agentes</option>
                    <option value="super-admin">Super Administradores</option>
                    <option value="formador">Formadores Oficiais</option>
                    <option value="formando">Formandos</option>
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Período de Relatório</label>
                  <select 
                    value={exportFilters.period} 
                    onChange={e => setExportFilters({...exportFilters, period: e.target.value})} 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 cursor-pointer border-0"
                  >
                    <option value="all">Histórico Total</option>
                    <option value="monthly">Relatório Mensal</option>
                    <option value="quarterly">Relatório Trimestral</option>
                    <option value="semi-annual">Relatório Semestral</option>
                    <option value="annual">Relatório Anual</option>
                    <option value="custom">Data Específica</option>
                  </select>
                </div>

                {exportFilters.period === "custom" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40">Início</label>
                      <input type="date" value={exportFilters.startDate} onChange={e => setExportFilters({...exportFilters, startDate: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-white/40">Fim</label>
                      <input type="date" value={exportFilters.endDate} onChange={e => setExportFilters({...exportFilters, endDate: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]" />
                    </div>
                  </motion.div>
                )}

                <div className="pt-4">
                  <button onClick={handleExportCSV} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] border-0 flex justify-center items-center gap-2">
                    <Download size={14} /> Descarregar Excel/CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}