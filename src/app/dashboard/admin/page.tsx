"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Trash2, Calendar, FileText,
  BarChart3, Loader2, Key, Plus, Clock, X, MapPin, Target,
  Users, Activity, Database, Search, User, Download, Pencil,
  Eye, EyeOff, CheckCircle2, AlertCircle, Upload, Trophy, LifeBuoy, MessageSquare, TrendingUp, Megaphone, Send
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminUser } from "@/hooks/useAdminUser";

export default function SuperAdminPage() {
  const { user: profile, loading: profileLoading } = useAdminUser();
  const [activeTab, setActiveTab] = useState<"users" | "agenda" | "arquivos" | "stats" | "anuncios">("users");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [statsData, setStatsData] = useState<any>(null);
  const [formadoresList, setFormadoresList] = useState<any[]>([]);
  const [mediaRadar, setMediaRadar] = useState<string>("");
  const [formadoresPendentes, setFormadoresPendentes] = useState<any[]>([]);
  const [approvingFormadorId, setApprovingFormadorId] = useState<string | null>(null);
  const [mediaRadarSaving, setMediaRadarSaving] = useState(false);
  const [mediaRadarSaved, setMediaRadarSaved] = useState(false);

  // Anúncios
  const [anuncioTitulo, setAnuncioTitulo] = useState("");
  const [anuncioMensagem, setAnuncioMensagem] = useState("");
  const [anuncioDestinatarios, setAnuncioDestinatarios] = useState<"todos" | "formadores" | "formandos">("todos");
  const [anuncioEnviarEmail, setAnuncioEnviarEmail] = useState(false);
  const [anuncioSending, setAnuncioSending] = useState(false);
  const [anuncioResult, setAnuncioResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [agendaForm, setAgendaForm] = useState({ titulo: "", local: "Luanda", data_evento: "", tipo: "Global" });
  const [powerForm, setPowerForm] = useState({ poder: "", data_expiracao: "" });
  const [exportFilters, setExportFilters] = useState({ role: "all", period: "all", startDate: "", endDate: "" });

  // Edição de agenda/ficheiros
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Criar utilizador
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "formando" });
  const [showNewUserPwd, setShowNewUserPwd] = useState(false);
  const [newUserSubmitting, setNewUserSubmitting] = useState(false);

  // Criar formando sem email
  const [isNoEmailModalOpen, setIsNoEmailModalOpen] = useState(false);
  const [noEmailForm, setNoEmailForm] = useState({ firstName: "", lastName: "", password: "" });
  const [showNoEmailPwd, setShowNoEmailPwd] = useState(false);
  const [noEmailSubmitting, setNoEmailSubmitting] = useState(false);
  const [noEmailResult, setNoEmailResult] = useState<{ username: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function saveMediaRadar() {
    const val = parseInt(mediaRadar);
    if (isNaN(val) || val < 0 || val > 100) return;
    setMediaRadarSaving(true);
    try {
      await fetch("/api/admin/hero-telemetria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_radar: val }),
      });
      setMediaRadarSaved(true);
      setTimeout(() => setMediaRadarSaved(false), 2500);
    } finally {
      setMediaRadarSaving(false);
    }
  }

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  function resetNewUserForm() {
    setNewUserForm({ firstName: "", lastName: "", email: "", password: "", role: "formando" });
    setShowNewUserPwd(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.firstName) return;
    setNewUserSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserForm.email,
          password: newUserForm.password,
          first_name: newUserForm.firstName,
          last_name: newUserForm.lastName,
          role: newUserForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro ao criar utilizador.");
      showToast("success", `${newUserForm.firstName} criado com sucesso.`);
      setIsNewUserModalOpen(false);
      resetNewUserForm();
      fetchData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setNewUserSubmitting(false);
    }
  }



  const isAdminOrSuper = (role?: string) => role === "admin" || role === "super-admin";
  const isFormador = profile?.role === "formador";
  const isStaff = isAdminOrSuper(profile?.role) || isFormador;

  const isPowerActive = useMemo(() => {
    if (!profile) return false;
    return isAdminOrSuper(profile.role);
  }, [profile]);

  const visibleTabs = useMemo(() => {
    if (isAdminOrSuper(profile?.role)) return ["users", "agenda", "arquivos", "stats", "anuncios"] as const;
    if (profile?.role === "formador") return ["users"] as const;
    return [] as const;
  }, [profile]);

  async function handleCriarFormandoSemEmail(e: React.FormEvent) {
    e.preventDefault();
    setNoEmailSubmitting(true);
    setNoEmailResult(null);
    try {
      const res = await fetch("/api/formador/criar-formando", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: noEmailForm.firstName,
          last_name: noEmailForm.lastName,
          password: noEmailForm.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar utilizador.");
      setNoEmailResult({ username: json.username });
      setNoEmailForm({ firstName: "", lastName: "", password: "" });
      fetchData();
    } catch (err: any) {
      setToast({ type: "error", text: err.message });
      setIsNoEmailModalOpen(false);
    } finally {
      setNoEmailSubmitting(false);
    }
  }

  async function enviarAnuncio() {
    if (!anuncioTitulo.trim() || !anuncioMensagem.trim()) return;
    setAnuncioSending(true);
    setAnuncioResult(null);
    try {
      const res = await fetch("/api/admin/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: anuncioTitulo, mensagem: anuncioMensagem, destinatarios: anuncioDestinatarios, enviarEmail: anuncioEnviarEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar.");
      const emailInfo = anuncioEnviarEmail ? ` · ${json.emails} email${json.emails !== 1 ? "s" : ""} enviado${json.emails !== 1 ? "s" : ""}.` : "";
      setAnuncioResult({ type: "success", text: `Anúncio enviado para ${json.enviados} utilizador${json.enviados !== 1 ? "es" : ""}${emailInfo}` });
      setAnuncioTitulo("");
      setAnuncioMensagem("");
    } catch (err: any) {
      setAnuncioResult({ type: "error", text: err.message });
    } finally {
      setAnuncioSending(false);
    }
  }

  useEffect(() => {
    if (!profileLoading && !isStaff) {
      router.push("/dashboard");
    }
  }, [profile, profileLoading, router, isStaff]);

  useEffect(() => {
    if (isStaff && activeTab !== "stats") fetchData();
  }, [activeTab, profile]);

  useEffect(() => {
    if (isAdminOrSuper(profile?.role) && activeTab === "users") {
      fetch("/api/formadores-pendentes")
        .then(r => r.json())
        .then(d => setFormadoresPendentes(d.formadores ?? []))
        .catch(() => {});
    }
  }, [activeTab, profile]);

  useEffect(() => {
    if (isAdminOrSuper(profile?.role) && activeTab === "stats" && mediaRadar === "") {
      fetch("/api/public/hero")
        .then(r => r.json())
        .then(d => { if (d.media_radar != null) setMediaRadar(String(d.media_radar)); })
        .catch(() => {});
    }
    if (isAdminOrSuper(profile?.role) && activeTab === "stats" && !statsData) {
      fetch("/api/analytics")
        .then(r => r.json())
        .then(setStatsData)
        .catch(() => setStatsData({}));
    }
  }, [activeTab, profile, statsData]);

  async function fetchData() {
    setLoading(true);
    setDbError(null);
    setSearchTerm("");

    const url = activeTab === "users" ? "/api/admin/utilizadores" :
                activeTab === "agenda" ? "/api/db/agenda_atividades" :
                activeTab === "arquivos" ? "/api/db/arquivos" : "/api/db/dashboard_stats";

    try {
      const res = await fetch(url);
      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch { setDbError("Resposta inválida do servidor. Tenta novamente."); setData([]); setLoading(false); return; }
      const { data: res_data, error } = json;
      if (!res.ok || error) { setDbError(typeof error === "string" ? error : error?.message ?? "Erro ao carregar dados."); setData([]); }
      else {
        const sorted = [...(res_data ?? [])].sort((a, b) => {
          const dA = a.created_at || a.updated_at || "";
          const dB = b.created_at || b.updated_at || "";
          return dB.localeCompare(dA);
        });
        setData(sorted);
        // Carregar lista de formadores para o select de associação (só admins)
        if (activeTab === "users" && isAdminOrSuper(profile?.role) && formadoresList.length === 0) {
          fetch("/api/db/profiles?eq.role=formador")
            .then(r => r.json())
            .then(d => setFormadoresList(d.data ?? []));
        }
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
              {tab === "users" ? "Utilizadores" : tab === "agenda" ? "Agenda" : tab === "arquivos" ? "Ficheiros" : tab === "stats" ? "Estatísticas" : "Anúncios"}
            </button>
          ))}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 px-5 py-3 rounded-xl flex items-center gap-3 shadow-xl border text-sm ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.text}
        </div>
      )}

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
          {activeTab === "users" && isAdminOrSuper(profile?.role) && (
            <>
              <button onClick={() => { resetNewUserForm(); setIsNewUserModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
                <Plus size={14} /> <span className="hidden sm:inline">Novo utilizador</span><span className="sm:hidden">Novo</span>
              </button>
              <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-sm text-white/60 hover:text-white transition-colors">
                <Download size={14} /> <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </>
          )}
          {activeTab === "users" && (profile?.role === "formador" || isAdminOrSuper(profile?.role)) && (
            <button onClick={() => { setNoEmailForm({ firstName: "", lastName: "", password: "" }); setNoEmailResult(null); setIsNoEmailModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
              <User size={14} /> <span className="hidden sm:inline">Formando sem email</span><span className="sm:hidden">Sem email</span>
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
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-6">
                {!statsData ? (
                  <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
                ) : (() => {
                  const t = statsData.totals ?? {};
                  const crescimento: any[] = statsData.crescimentoMensal ?? [];
                  const inativos: any[] = statsData.utilizadoresInativos ?? [];
                  const ticketsCat: any[] = statsData.ticketsPorCategoria ?? [];
                  const visibilidade: any[] = statsData.ficheirosPorVisibilidade ?? [];
                  const tipos: any[] = statsData.ficheirosPorTipo ?? [];
                  const eventosTipo: any[] = statsData.eventosPorTipo ?? [];
                  const com = statsData.comunidadeStats ?? {};
                  const maxCrescimento = Math.max(...crescimento.map((m: any) => Number(m.total)), 1);
                  const maxTicketCat = Math.max(...ticketsCat.map((c: any) => Number(c.total)), 1);
                  const maxTipo = Math.max(...tipos.map((t: any) => Number(t.total)), 1);

                  const VIS_LABEL: Record<string, string> = { publico: "Público", privado: "Privado", formadores: "Formadores", turma: "Turma" };
                  const VIS_COLOR: Record<string, string> = { publico: "bg-emerald-500", privado: "bg-red-500", formadores: "bg-blue-500", turma: "bg-amber-500" };

                  // Taxa de resolução real
                  const totalTickets = ticketsCat.reduce((s: number, c: any) => s + Number(c.total), 0);
                  const resolvidos = ticketsCat.reduce((s: number, c: any) => s + Number(c.resolvidos), 0);
                  const taxaResolucao = totalTickets > 0 ? Math.round((resolvidos / totalTickets) * 100) : 100;

                  return (
                    <>
                      {/* Configurações do Site Público */}
                      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Target size={15} className="text-blue-400" />
                          <h3 className="text-sm font-semibold text-white">Configurações do Site Público</h3>
                          <span className="text-[10px] text-white/30 ml-1">Valores apresentados na página inicial</span>
                        </div>
                        <div className="flex items-end gap-3 max-w-xs">
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[11px] text-white/40 uppercase tracking-wider">Radar de Integração (%)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" max="100"
                                value={mediaRadar}
                                onChange={e => setMediaRadar(e.target.value)}
                                placeholder="0 – 100"
                                className="w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                              />
                              <span className="text-white/30 text-sm">%</span>
                            </div>
                            <p className="text-[10px] text-white/25">Aparece na Fase 2 "Capacitação" do site público</p>
                          </div>
                          <button
                            onClick={saveMediaRadar}
                            disabled={mediaRadarSaving || mediaRadar === ""}
                            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            {mediaRadarSaving ? <Loader2 size={13} className="animate-spin" /> : mediaRadarSaved ? <CheckCircle2 size={13} className="text-emerald-400" /> : null}
                            {mediaRadarSaved ? "Guardado!" : "Guardar"}
                          </button>
                        </div>
                      </div>

                      {/* Linha 1: Crescimento + Saúde da comunidade */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Crescimento mensal */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-400" />
                            <span className="text-sm font-semibold text-white">Novos registos por mês</span>
                            <span className="text-[10px] text-white/25 ml-auto">últimos 6 meses</span>
                          </div>
                          {crescimento.length === 0 ? (
                            <p className="text-xs text-white/25 text-center py-6">Sem dados.</p>
                          ) : (
                            <div className="flex items-end gap-2 h-24">
                              {crescimento.map((m: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[9px] text-white/40">{m.total}</span>
                                  <div className="w-full bg-blue-500/60 rounded-t-sm" style={{ height: `${Math.max((Number(m.total) / maxCrescimento) * 80, 4)}px` }} />
                                  <span className="text-[9px] text-white/30">{m.mes}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Saúde da comunidade */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-purple-400" />
                            <span className="text-sm font-semibold text-white">Saúde da comunidade</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Publicações", value: com.total_posts ?? 0, color: "text-white" },
                              { label: "Comentários", value: com.total_comentarios ?? 0, color: "text-white" },
                              { label: "Média comentários/post", value: com.media_comentarios ?? "0", color: Number(com.media_comentarios) >= 1 ? "text-emerald-400" : "text-amber-400" },
                              { label: "Posts sem resposta", value: com.posts_sem_resposta ?? 0, color: Number(com.posts_sem_resposta) > 0 ? "text-red-400" : "text-emerald-400" },
                            ].map((s, i) => (
                              <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Linha 2: Tickets + Visibilidade ficheiros */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Tickets por categoria */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LifeBuoy size={14} className="text-amber-400" />
                              <span className="text-sm font-semibold text-white">Tickets por categoria</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${taxaResolucao >= 80 ? "text-emerald-400" : taxaResolucao >= 50 ? "text-amber-400" : "text-red-400"}`}>{taxaResolucao}%</span>
                              <span className="text-[10px] text-white/25">resolvidos</span>
                            </div>
                          </div>
                          {ticketsCat.length === 0 ? (
                            <p className="text-xs text-white/25 text-center py-4">Sem tickets.</p>
                          ) : (
                            <div className="space-y-3">
                              {ticketsCat.map((c: any, i: number) => (
                                <div key={i} className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/70">{c.category}</span>
                                    <span className="text-xs text-white/40">{c.resolvidos}/{c.total}</span>
                                  </div>
                                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden relative">
                                    <div className="h-full bg-white/10 rounded-full absolute inset-0" style={{ width: `${(Number(c.total)/maxTicketCat)*100}%` }} />
                                    <div className="h-full bg-emerald-500/70 rounded-full absolute inset-0" style={{ width: `${(Number(c.resolvidos)/maxTicketCat)*100}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Ficheiros por visibilidade */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <Database size={14} className="text-emerald-400" />
                            <span className="text-sm font-semibold text-white">Ficheiros por visibilidade</span>
                          </div>
                          {visibilidade.length === 0 ? (
                            <p className="text-xs text-white/25 text-center py-4">Sem dados.</p>
                          ) : (
                            <div className="space-y-3">
                              {visibilidade.map((v: any, i: number) => {
                                const maxV = Math.max(...visibilidade.map((x: any) => Number(x.total)));
                                return (
                                  <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-white/70">{VIS_LABEL[v.visibilidade] ?? v.visibilidade}</span>
                                      <span className="text-xs text-white/40">{v.total} ficheiros</span>
                                    </div>
                                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${VIS_COLOR[v.visibilidade] ?? "bg-white"}/60`} style={{ width: `${(Number(v.total)/maxV)*100}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Linha 3: Tipos de ficheiro + Eventos */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Tipos de ficheiro */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-blue-400" />
                            <span className="text-sm font-semibold text-white">Tipos de ficheiro</span>
                          </div>
                          {tipos.length === 0 ? (
                            <p className="text-xs text-white/25 text-center py-4">Sem dados.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {tipos.filter((t: any) => t.extensao).map((t: any, i: number) => (
                                <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2 flex items-center justify-between">
                                  <span className="text-xs text-white/60 uppercase font-mono">.{t.extensao}</span>
                                  <span className="text-xs font-bold text-white/80">{t.total}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Eventos por tipo/formato */}
                        <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-purple-400" />
                            <span className="text-sm font-semibold text-white">Eventos por tipo</span>
                          </div>
                          {eventosTipo.length === 0 ? (
                            <p className="text-xs text-white/25 text-center py-4">Sem dados.</p>
                          ) : (
                            <div className="space-y-3">
                              {eventosTipo.map((e: any, i: number) => (
                                <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2.5 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white/70">{e.tipo}</span>
                                    <span className="text-xs text-white/40">{e.total} total</span>
                                  </div>
                                  <div className="flex gap-3 text-[10px] text-white/35">
                                    <span>🏢 {e.presencial} presencial</span>
                                    <span>💻 {e.online} online</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Utilizadores inativos */}
                      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-red-400" />
                            <span className="text-sm font-semibold text-white">Utilizadores sem actividade</span>
                            <span className="text-[10px] text-white/25">(sem uploads nem publicações)</span>
                          </div>
                          <span className="text-xs text-red-400 font-medium">{inativos.length} identificados</span>
                        </div>
                        {inativos.length === 0 ? (
                          <p className="text-xs text-emerald-400 text-center py-2">✓ Todos os utilizadores têm actividade.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {inativos.map((u: any, i: number) => (
                              <div key={i} className="flex items-center gap-2.5 bg-white/[0.02] rounded-lg px-3 py-2">
                                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-[10px] font-bold shrink-0">
                                  {(u.first_name?.[0] || "?").toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-white/60 truncate">{u.first_name} {u.last_name}</p>
                                  <p className="text-[9px] text-white/25 capitalize">{u.role} · desde {new Date(u.created_at).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : activeTab === "users" && groupedUsers ? (
              <motion.div key="users_list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

                {/* Formadores pendentes de aprovação */}
                {isAdminOrSuper(profile?.role) && formadoresPendentes.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-amber-400 shrink-0" />
                      <span className="text-sm font-semibold text-amber-300">
                        {formadoresPendentes.length === 1
                          ? "1 formador aguarda aprovação"
                          : `${formadoresPendentes.length} formadores aguardam aprovação`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {formadoresPendentes.map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white font-medium truncate">{f.first_name} {f.last_name}</p>
                            <p className="text-[11px] text-white/40 truncate">{f.email}{f.especialidade ? ` · ${f.especialidade}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              disabled={approvingFormadorId === f.id}
                              onClick={async () => {
                                setApprovingFormadorId(f.id);
                                await fetch("/api/formadores-pendentes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ formador_id: f.id, acao: "aprovar" }) });
                                setFormadoresPendentes(prev => prev.filter(x => x.id !== f.id));
                                setApprovingFormadorId(null);
                                fetchData();
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            >Aprovar</button>
                            <button
                              disabled={approvingFormadorId === f.id}
                              onClick={async () => {
                                setApprovingFormadorId(f.id);
                                await fetch("/api/formadores-pendentes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ formador_id: f.id, acao: "rejeitar" }) });
                                setFormadoresPendentes(prev => prev.filter(x => x.id !== f.id));
                                setApprovingFormadorId(null);
                              }}
                              className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >Rejeitar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                                {/* Controlos para formadores */}
                                {isFormador && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Badge de estado da associação */}
                                    <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                      item.ff_status === 'aceite' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                      item.ff_status === 'rejeitado' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                      item.ff_status === 'removido' ? 'text-white/20 bg-white/5 border-white/10' :
                                      'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                    }`}>
                                      {item.ff_status === 'aceite' ? '✓ Aceite' :
                                       item.ff_status === 'rejeitado' ? 'Rejeitado' :
                                       item.ff_status === 'removido' ? 'Removido' : 'Pendente'}
                                    </span>
                                    {item.ano_letivo && (
                                      <span className="text-[9px] text-white/25">{item.ano_letivo}</span>
                                    )}
                                    {/* Aprovar/Rejeitar se pendente */}
                                    {item.ff_status === 'pendente' && (
                                      <>
                                        <button
                                          onClick={() => fetch("/api/formandos-pendentes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ formando_id: item.id, acao: "aprovar" }) }).then(() => fetchData())}
                                          className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] hover:bg-emerald-500/20 transition-colors"
                                        >Aprovar</button>
                                        <button
                                          onClick={() => fetch("/api/formandos-pendentes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ formando_id: item.id, acao: "rejeitar" }) }).then(() => fetchData())}
                                          className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] hover:bg-red-500/20 transition-colors"
                                        >Rejeitar</button>
                                      </>
                                    )}
                                    {/* Remover se aceite */}
                                    {item.ff_status === 'aceite' && (
                                      <button
                                        onClick={() => { if (confirm(`Remover ${item.first_name} ${item.last_name} como seu formando?`)) fetch("/api/formandos-pendentes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ formando_id: item.id, acao: "remover" }) }).then(() => fetchData()); }}
                                        className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30 text-[10px] hover:text-red-400 hover:border-red-500/20 transition-colors"
                                      >Remover</button>
                                    )}
                                  </div>
                                )}
                                {/* Controlos de admin */}
                                {isAdminOrSuper(profile?.role) && (
                                  <>
                                    <select value={item.role} onChange={(e) => handleUpdate(item.id, { role: e.target.value })}
                                      className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 outline-none cursor-pointer"
                                    >
                                      <option value="formando" className="bg-[#0d0d14]">Formando</option>
                                      <option value="formador" className="bg-[#0d0d14]">Formador</option>
                                      <option value="admin" className="bg-[#0d0d14]">Admin</option>
                                    </select>
                                    <div className="flex flex-col gap-1">
                                      {item.status === 'pendente' && (
                                        <span className="text-[9px] uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-center">Email não confirmado</span>
                                      )}
                                      {item.status === 'email_confirmado' && (
                                        <span className="text-[9px] uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-center">✓ Email confirmado</span>
                                      )}
                                      <select
                                        value={item.status || "pendente"}
                                        onChange={(e) => handleUpdate(item.id, { status: e.target.value })}
                                        disabled={item.status === 'pendente'}
                                        title={item.status === 'pendente' ? "Aguarda confirmação de email" : ""}
                                        className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <option value="pendente" className="bg-[#0d0d14]">Pendente</option>
                                        <option value="email_confirmado" className="bg-[#0d0d14]">Email confirmado</option>
                                        <option value="activo" className="bg-[#0d0d14]">Activo</option>
                                        <option value="suspenso" className="bg-[#0d0d14]">Suspenso</option>
                                      </select>
                                    </div>
                                    {item.role === "formando" && formadoresList.length > 0 && (
                                      <select
                                        value={item.formador_id ?? ""}
                                        onChange={e => handleUpdate(item.id, { formador_id: e.target.value || null })}
                                        className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 outline-none cursor-pointer max-w-[160px]"
                                        title="Formador associado"
                                      >
                                        <option value="" className="bg-[#0d0d14]">— Sem formador —</option>
                                        {formadoresList.map((f: any) => (
                                          <option key={f.id} value={f.id} className="bg-[#0d0d14]">{f.first_name} {f.last_name}</option>
                                        ))}
                                      </select>
                                    )}
                                    <button onClick={() => openPowerModal(item)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors ${item.temporary_power ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.04] text-white/30 hover:text-white"}`}>
                                      <Clock size={11} /> {item.temporary_power ? "Poder activo" : "Poder"}
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : activeTab === "anuncios" ? (
              <motion.div key="anuncios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-6">
                <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Megaphone size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Novo Anúncio</h3>
                      <p className="text-xs text-white/30">Envia uma notificação para os utilizadores da plataforma.</p>
                    </div>
                  </div>

                  {/* Destinatários */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/40">Destinatários</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "todos", label: "Todos" },
                        { value: "formadores", label: "Formadores" },
                        { value: "formandos", label: "Formandos" },
                      ] as const).map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setAnuncioDestinatarios(opt.value)}
                          className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                            anuncioDestinatarios === opt.value
                              ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                              : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.05]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Título</label>
                    <input
                      value={anuncioTitulo}
                      onChange={e => setAnuncioTitulo(e.target.value)}
                      placeholder="Ex: Nova funcionalidade disponível"
                      maxLength={100}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>

                  {/* Mensagem */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Mensagem</label>
                    <textarea
                      value={anuncioMensagem}
                      onChange={e => setAnuncioMensagem(e.target.value)}
                      placeholder="Descreve a novidade ou aviso que queres partilhar..."
                      rows={4}
                      maxLength={500}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-white/20 text-right">{anuncioMensagem.length}/500</p>
                  </div>

                  {/* Toggle email */}
                  <label className="flex items-center justify-between gap-3 py-3 border-t border-white/[0.06] cursor-pointer group">
                    <div>
                      <p className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">Enviar também por email</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Cada utilizador recebe um email além da notificação na plataforma.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnuncioEnviarEmail(v => !v)}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${anuncioEnviarEmail ? "bg-amber-500" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${anuncioEnviarEmail ? "left-5" : "left-1"}`} />
                    </button>
                  </label>

                  {/* Feedback */}
                  {anuncioResult && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      anuncioResult.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                      {anuncioResult.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {anuncioResult.text}
                    </div>
                  )}

                  <button
                    onClick={enviarAnuncio}
                    disabled={anuncioSending || !anuncioTitulo.trim() || !anuncioMensagem.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {anuncioSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {anuncioSending ? "A enviar..." : "Enviar Anúncio"}
                  </button>
                </div>
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

      {/* MODAL: NOVO UTILIZADOR */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewUserModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-blue-400" /> Novo utilizador
              </h3>
              <button onClick={() => setIsNewUserModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Nome próprio *</label>
                  <input required value={newUserForm.firstName} onChange={e => setNewUserForm({...newUserForm, firstName: e.target.value})}
                    placeholder="Ex: João"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Apelido</label>
                  <input value={newUserForm.lastName} onChange={e => setNewUserForm({...newUserForm, lastName: e.target.value})}
                    placeholder="Ex: Silva"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">E-mail *</label>
                <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="utilizador@sabermais.ao"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Palavra-passe *</label>
                <div className="relative">
                  <input required type={showNewUserPwd ? "text" : "password"} value={newUserForm.password}
                    onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
                  <button type="button" onClick={() => setShowNewUserPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showNewUserPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Cargo</label>
                <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50">
                  <option value="formando" className="bg-[#0d0d14]">Formando</option>
                  <option value="formador" className="bg-[#0d0d14]">Formador</option>
                  <option value="admin" className="bg-[#0d0d14]">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsNewUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={newUserSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {newUserSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Criar</>}
                </button>
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
      {/* MODAL: Criar formando sem email */}
      {isNoEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsNoEmailModalOpen(false); setNoEmailResult(null); }} />
          <div className="relative bg-[#0d0d14] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <User size={15} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Registar formando sem email</h3>
              </div>
              <button onClick={() => { setIsNoEmailModalOpen(false); setNoEmailResult(null); }} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
            </div>

            {noEmailResult ? (
              <div className="px-6 py-8 space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Formando criado com sucesso!</p>
                  <p className="text-xs text-white/40 mt-1">Guarda estas credenciais — não serão mostradas novamente.</p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-4 text-left space-y-2">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Nome de utilizador</p>
                    <p className="text-sm font-mono font-bold text-blue-300">{noEmailResult.username}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Password</p>
                    <p className="text-sm font-mono font-bold text-white/70">{noEmailForm.password || "••••••••"}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/30">O formando faz login em <span className="text-white/60">sabermais.edu.ao</span> com o utilizador e a password acima.</p>
                <button onClick={() => { setIsNoEmailModalOpen(false); setNoEmailResult(null); }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCriarFormandoSemEmail} className="px-6 py-5 space-y-4">
                <p className="text-xs text-white/40">O formando fará login com um <strong className="text-white/60">nome de utilizador</strong> gerado automaticamente a partir do nome.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Nome</label>
                    <input required value={noEmailForm.firstName} onChange={e => setNoEmailForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="João"
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Apelido</label>
                    <input required value={noEmailForm.lastName} onChange={e => setNoEmailForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Silva"
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Password temporária</label>
                  <div className="relative">
                    <input required type={showNoEmailPwd ? "text" : "password"} value={noEmailForm.password}
                      onChange={e => setNoEmailForm(f => ({ ...f, password: e.target.value }))}
                      minLength={6} placeholder="Mínimo 6 caracteres"
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" />
                    <button type="button" onClick={() => setShowNoEmailPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                      {showNoEmailPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsNoEmailModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/[0.06] text-sm text-white/50 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={noEmailSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {noEmailSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {noEmailSubmitting ? "A criar..." : "Criar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
