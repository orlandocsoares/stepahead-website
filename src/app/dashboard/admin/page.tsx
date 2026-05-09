"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Trash2, Calendar, FileText, 
  BarChart3, Loader2, Key, Plus, Clock, X, MapPin, Target,
  Users, Activity, Database, Search
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
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Formulários
  const [agendaForm, setAgendaForm] = useState({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
  const [powerForm, setPowerForm] = useState({ poder: "", data_expiracao: "" });

  // Protecção de Rota
  useEffect(() => {
    if (!profileLoading && profile?.role !== "super-admin") {
      router.push("/dashboard");
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (profile?.role === "super-admin") fetchData();
  }, [activeTab, profile]);

  async function fetchData() {
    setLoading(true);
    setDbError(null);
    setSearchTerm(""); // Limpa pesquisa ao mudar de tab
    
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

  // Lógica de Filtragem Dinâmica Avançada (Abrange primeiro e último nome na busca)
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
    <div className="max-w-[1400px] mx-auto py-24 px-10 md:pl-48 min-h-screen font-sans relative z-10">
      
      {/* HEADER DE COMANDO */}
      <header className="mb-20 flex flex-col lg:flex-row justify-between items-end gap-10">
        <div className="space-y-4 text-left">
          <p className="text-[9px] tracking-[1em] text-blue-500 uppercase font-black italic">Operational Governance</p>
          <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
            Centro de <span className="opacity-40 not-italic font-bold">Controlo</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          {/* MENU DE SEPARADORES */}
          <div className="flex bg-black/20 border border-white/10 p-2 rounded-3xl backdrop-blur-md shadow-2xl">
            {["users", "agenda", "arquivos", "stats"].map((tab) => (
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
        <div className="mb-10 p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-mono">
          Erro de Comunicação: {dbError}
        </div>
      )}

      {/* CONTEÚDO DINÂMICO */}
      <div className="space-y-6">
        
        {/* BARRA DE PESQUISA E ACÇÕES */}
        {activeTab !== "stats" && (
          <div className="mb-10 flex flex-col sm:flex-row gap-6 justify-between items-center bg-white/[0.01] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-sm">
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
            
            <AnimatePresence>
              {activeTab === "agenda" && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsAgendaModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-[10px] uppercase font-black tracking-widest rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={16} /> Planear Evento
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

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
          ) : (
            /* LISTAGENS OPERACIONAIS */
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {filteredData.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                  className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-lg flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-black/40 hover:border-blue-500/30 transition-all duration-700 shadow-xl"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 items-center w-full">
                    
                    {/* Identificação com Nome Completo (Refinamento de Mestre) */}
                    <div className="col-span-1 space-y-1 relative">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-light text-2xl uppercase tracking-tighter italic drop-shadow-lg truncate">
                          {activeTab === "users" 
                            ? `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Agente Sem Nome"
                            : (item.titulo || item.label || item.provincia)}
                        </p>
                        {activeTab === "users" && item.temporary_power && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-blue-400 uppercase tracking-[0.4em] font-black italic">
                        {item.role || item.tipo || item.area || "Activo"}
                      </p>
                    </div>
                    
                    {/* Controlos */}
                    <div className="col-span-3 w-full flex flex-wrap items-center gap-6">
                       {activeTab === "users" && (
                         <>
                            {/* CARGO */}
                            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
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

                            {/* STATUS */}
                            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                               <ShieldCheck size={12} className="text-emerald-500/50" />
                               <select 
                                value={item.status || "aprovado"} 
                                onChange={(e) => handleUpdate(item.id, { status: e.target.value })}
                                className="bg-transparent text-[9px] uppercase font-black text-emerald-400 outline-none cursor-pointer border-0 ring-0 focus:ring-0"
                               >
                                 <option value="pendente" className="bg-zinc-900 text-white">Pendente</option>
                                 <option value="aprovado" className="bg-zinc-900 text-white">Aprovado</option>
                               </select>
                            </div>

                            {/* PODERES */}
                            <button 
                              onClick={() => openPowerModal(item)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] uppercase font-black tracking-widest ${item.temporary_power ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white"}`}
                            >
                              <Clock size={12} />
                              {item.temporary_power ? `Poder: ${item.temporary_power}` : "Atribuir Poder"}
                            </button>
                         </>
                       )}

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

                  {/* Excluir */}
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
      </div>

      {/* MODAIS */}
      <AnimatePresence>
        {isAgendaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAgendaModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-zinc-950/80 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
              <button type="button" onClick={() => setIsAgendaModalOpen(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors bg-transparent border-0"><X size={20} /></button>
              <h2 className="text-2xl font-light text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3"><Calendar className="text-blue-500"/> Planear Evento</h2>
              <form onSubmit={handleCreateAgenda} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Título do Evento</label>
                  <input required type="text" value={agendaForm.titulo} onChange={e => setAgendaForm({...agendaForm, titulo: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors" placeholder="Ex: Sessão de Capacitação..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Privilégio Específico</label>
                  <input type="text" value={powerForm.poder} onChange={e => setPowerForm({...powerForm, poder: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-colors" placeholder="Ex: Auditor_Bie, Gestor_Recursos, (Vazio p/ remover)" />
                </div>
                <div className="space-y-2">
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

      <div className="mt-40 opacity-20 text-center">
         <p className="text-[7px] uppercase tracking-[2em] font-black italic drop-shadow-md">End of Management Record</p>
      </div>
    </div>
  );
}