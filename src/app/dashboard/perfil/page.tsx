"use client";

import { useAdminUser } from "@/hooks/useAdminUser";
import {
  User, ShieldCheck, Save, Loader2, Camera,
  Key, FileText, CheckCircle2, AlertCircle, Activity, Award,
  GraduationCap, Plus, X, Clock, CheckCheck, XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getAnoLetivoActivo, getAnosLetivos } from "@/lib/ano-letivo";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilPage() {
  const { user, loading } = useAdminUser();
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [anoLetivo, setAnoLetivo] = useState(getAnoLetivoActivo());
  const [associacoes, setAssociacoes] = useState<any[]>([]);
  const [formadoresDisp, setFormadoresDisp] = useState<any[]>([]);
  const [addingFormador, setAddingFormador] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [password, setPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [areasDisponiveis, setAreasDisponiveis] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) setLocalProfile({ ...user }); }, [user]);

  useEffect(() => {
    fetch("/api/areas").then(r => r.json()).then(d => setAreasDisponiveis(d.areas ?? []));
  }, []);

  useEffect(() => {
    if (user?.role === "formando") {
      fetch(`/api/meus-formadores?ano=${encodeURIComponent(anoLetivo)}`)
        .then(r => r.json())
        .then(d => { setAssociacoes(d.associacoes ?? []); setFormadoresDisp(d.formadores ?? []); })
        .catch(() => {});
    }
  }, [user, anoLetivo]);

  async function handleAddFormador(formador_id: string) {
    setAddingFormador(true);
    await fetch("/api/meus-formadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formador_id, ano_letivo: anoLetivo }),
    });
    const d = await fetch(`/api/meus-formadores?ano=${encodeURIComponent(anoLetivo)}`).then(r => r.json());
    setAssociacoes(d.associacoes ?? []); setFormadoresDisp(d.formadores ?? []);
    setAddingFormador(false);
  }

  async function handleRemoveFormador(formador_id: string) {
    if (!confirm("Remover este formador? Perderás acesso aos seus conteúdos.")) return;
    await fetch("/api/meus-formadores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formador_id, ano_letivo: anoLetivo }),
    });
    setAssociacoes(prev => prev.filter(a => a.formador_id !== formador_id));
  }

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    if (!localProfile?.id) return;
    if (localProfile.role === "formador" && !localProfile.biografia?.trim()) {
      showMsg("error", "Como Formador, é obrigatório preencher a Biografia Profissional."); return;
    }
    setIsSaving(true);
    const res = await fetch("/api/db/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: {
          first_name: localProfile.first_name,
          last_name: localProfile.last_name,
          specialization: localProfile.specialization,
          province: localProfile.province,
          biografia: localProfile.biografia,
        },
        eq: { id: localProfile.id },
      }),
    });
    const { error } = await res.json();
    if (error) showMsg("error", error);
    else showMsg("success", "Perfil actualizado com sucesso.");
    setIsSaving(false);
  };

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      showMsg("error", "A nova palavra-passe deve ter pelo menos 6 caracteres."); return;
    }
    setIsSavingPassword(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const { error } = await res.json();
    if (error) showMsg("error", error);
    else { showMsg("success", "Palavra-passe actualizada com sucesso."); setPassword(""); }
    setIsSavingPassword(false);
  };

  // Avatar enviado para /api/storage/upload (bucket "avatars") e URL guardado em profiles.avatar_url
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !localProfile?.id) return;
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${localProfile.id}_${Date.now()}.${ext}`;
      const form = new FormData();
      form.append("bucket", "avatars"); form.append("path", fileName);
      form.append("file", file); form.append("upsert", "true");
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Erro no upload.");
      const avatarUrl = `/storage/v1/object/public/avatars/${fileName}`;
      await fetch("/api/db/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: { avatar_url: avatarUrl }, eq: { id: localProfile.id } }),
      });
      setLocalProfile({ ...localProfile, avatar_url: avatarUrl });
      showMsg("success", "Fotografia actualizada.");
    } catch { showMsg("error", "Erro ao carregar imagem."); }
    finally { setIsUploadingAvatar(false); }
  };

  if (loading || !localProfile) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-blue-500" size={28} />
    </div>
  );

  const roleLabel =
    localProfile.role === "super-admin" ? "Super Administrador"
    : localProfile.role === "admin" ? "Administrador"
    : localProfile.role === "formador" ? "Formador"
    : "Formando";

  const initial = (localProfile.first_name?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6 w-full">

      {/* Feedback toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 px-5 py-3 rounded-xl flex items-center gap-3 shadow-xl border text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cabeçalho do perfil ── */}
      <div id="tour-profile-header" className="c-bg2 border c-br rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-24 h-24 rounded-full border-2 c-br2 c-s1 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/50 ${isUploadingAvatar ? "opacity-50" : ""}`}>
              {localProfile.avatar_url
                ? <img src={localProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold c-tx5">{initial}</span>
              }
              <div className="absolute inset-0 bg-blue-600/80 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar
                  ? <Loader2 className="animate-spin c-tx" size={20} />
                  : <Camera className="c-tx" size={20} />
                }
                <span className="text-[9px] c-tx font-bold mt-1">Alterar</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-semibold c-tx">
              {localProfile.first_name} <span className="c-tx3">{localProfile.last_name}</span>
            </h2>
            <p className="text-sm c-tx4 mt-0.5">{localProfile.email}</p>
            <p className="text-[10px] c-tx5 tracking-widest uppercase mt-1">Saber Mais Angola // III Ciclo</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {roleLabel}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 ${
                localProfile.status === "activo" || localProfile.status === "aprovado"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : localProfile.status === "suspenso"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                <Activity size={11} /> {
                  localProfile.status === "activo" || localProfile.status === "aprovado" ? "Activo"
                  : localProfile.status === "suspenso" ? "Suspenso"
                  : localProfile.status === "email_confirmado" ? "Email confirmado"
                  : "Pendente"
                }
              </span>
            </div>
          </div>

          {/* Progresso */}
          <div className="hidden lg:block shrink-0 w-48 space-y-2">
            <div className="flex justify-between text-xs c-tx4">
              <span className="flex items-center gap-1"><Award size={11} /> Capacitação</span>
              <span className="c-tx2">85%</span>
            </div>
            <div className="h-1.5 c-s2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" style={{ width: "85%" }} />
            </div>
            <p className="text-[10px] c-tx5">Guia Pedagógico III</p>
          </div>
        </div>
      </div>

      {/* ── Segurança + Dados de identidade lado a lado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Segurança */}
        <div id="tour-security-section" className="c-bg2 border c-br rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold c-tx flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck size={13} className="text-emerald-400" /> Segurança
          </h3>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Key size={13} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nova palavra-passe (mín. 6)"
                className="w-full pl-8 pr-3 py-2 c-s1 border c-br rounded-lg text-xs c-tx placeholder:c-tx5 outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={isSavingPassword || !password}
              className="px-3 py-2 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30 flex items-center gap-1.5 shrink-0"
            >
              {isSavingPassword ? <Loader2 size={12} className="animate-spin" /> : null}
              Actualizar
            </button>
          </div>
        </div>

        {/* Dados de identidade */}
        <div id="tour-identity-section" className="c-bg2 border c-br rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold c-tx flex items-center gap-2 uppercase tracking-wider">
            <FileText size={13} className="text-blue-400" /> Dados de identidade
          </h3>
          <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] c-tx3">Nome próprio</label>
            <input
              value={localProfile.first_name || ""}
              onChange={e => setLocalProfile({ ...localProfile, first_name: e.target.value })}
              className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] c-tx3">Apelido</label>
            <input
              value={localProfile.last_name || ""}
              onChange={e => setLocalProfile({ ...localProfile, last_name: e.target.value })}
              className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] c-tx3">E-mail</label>
            <div className="px-3 py-2 bg-white/[0.02] border c-br rounded-lg text-xs c-tx4 cursor-not-allowed font-mono truncate">
              {localProfile.email}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] c-tx3">Província</label>
            <select
              value={localProfile.province || ""}
              onChange={e => setLocalProfile({ ...localProfile, province: e.target.value })}
              className="w-full c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="" className="c-bg">Seleccionar...</option>
              <option value="Luanda" className="c-bg">Luanda</option>
              <option value="Bié" className="c-bg">Bié</option>
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] c-tx3 flex items-center justify-between">
              <span>Áreas</span>
              <span className="c-tx5 text-[10px]">
                {localProfile.role === "formando" ? "definidas pelos teus formadores" : "clica para seleccionar"}
              </span>
            </label>
            {localProfile.role === "formando" ? (() => {
              const areasFormandos = Array.from(new Set(
                associacoes.filter(a => a.status === "aceite" && a.especialidade).map(a => a.especialidade)
              ));
              return (
                <div className="flex flex-wrap gap-1.5">
                  {areasFormandos.length === 0 ? (
                    <p className="text-[10px] c-tx5 self-center ml-1">Sem área — associa um formador para definir a tua área.</p>
                  ) : (
                    areasFormandos.map(area => (
                      <span
                        key={area}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium border bg-black/30 text-white/70 border-white/15 backdrop-blur-sm"
                      >
                        {area}
                      </span>
                    ))
                  )}
                </div>
              );
            })() : (() => {
              const AREAS = areasDisponiveis;
              let selected: string[] = [];
              try { selected = JSON.parse(localProfile.specialization || "[]"); } catch { selected = localProfile.specialization ? [localProfile.specialization] : []; }
              const toggle = (area: string) => {
                const next = selected.includes(area) ? selected.filter(a => a !== area) : [...selected, area];
                setLocalProfile({ ...localProfile, specialization: JSON.stringify(next) });
              };
              return (
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map(area => {
                    const active = selected.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggle(area)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                          active
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-black/30 text-white/70 border-white/15 hover:bg-black/50 hover:text-white backdrop-blur-sm"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                  {selected.length === 0 && (
                    <p className="text-[10px] c-tx5 self-center ml-1">Nenhuma seleccionada — acesso a todas as áreas</p>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] c-tx3 flex items-center justify-between">
              <span>Biografia profissional</span>
              {localProfile.role === "formador" && (
                <span className="text-amber-400 text-[10px]">* Obrigatório</span>
              )}
            </label>
            <textarea
              value={localProfile.biografia || ""}
              onChange={e => setLocalProfile({ ...localProfile, biografia: e.target.value })}
              rows={2}
              placeholder="Breve resumo da sua jornada..."
              className={`w-full c-s1 border rounded-lg px-3 py-2 text-xs c-tx2 placeholder:c-tx5 outline-none transition-colors resize-none ${
                localProfile.role === "formador" && !localProfile.biografia?.trim()
                  ? "border-amber-500/40 focus:border-amber-400"
                  : "c-br focus:border-blue-500/50"
              }`}
            />
          </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-xs c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
            </button>
          </div>
        </div>

      </div>{/* fim grid lg:grid-cols-2 */}

      {/* ── Secção de Formadores (só formandos) ── */}
      {localProfile.role === "formando" && (
        <div className="c-bg2 border c-br rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold c-tx">Os meus formadores</h3>
            </div>
            <select
              value={anoLetivo}
              onChange={e => setAnoLetivo(e.target.value)}
              className="text-xs c-s1 border c-br rounded-lg px-2 py-1.5 c-tx2 outline-none"
            >
              {getAnosLetivos().map(a => (
                <option key={a} value={a} className="c-bg">{a}</option>
              ))}
            </select>
          </div>

          {/* Lista de associações */}
          {associacoes.length === 0 ? (
            <p className="text-xs c-tx4 text-center py-4">Sem formadores associados neste ano letivo.</p>
          ) : (
            <div className="space-y-2">
              {associacoes.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-black/20 rounded-xl border c-br">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                    {(a.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm c-tx font-medium">{a.first_name} {a.last_name}</p>
                    {a.especialidade && <p className="text-xs c-tx3">{a.especialidade}</p>}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    a.status === 'aceite' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    a.status === 'rejeitado' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {a.status === 'aceite' ? '✓ Aceite' : a.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                  </span>
                  <button
                    onClick={() => handleRemoveFormador(a.formador_id)}
                    className="p-1.5 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover formador"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar formador */}
          {formadoresDisp.filter(f => !associacoes.some(a => a.formador_id === f.id)).length > 0 && (
            <div className="space-y-2 pt-2 border-t c-br">
              <p className="text-xs c-tx4 font-medium">Adicionar formador</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {formadoresDisp
                  .filter(f => !associacoes.some(a => a.formador_id === f.id))
                  .map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleAddFormador(f.id)}
                      disabled={addingFormador}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border c-br hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left disabled:opacity-50"
                    >
                      <Plus size={12} className="text-blue-400 shrink-0" />
                      <span className="text-xs c-tx2">{f.first_name} {f.last_name}</span>
                      {f.especialidade && <span className="text-[10px] c-tx4 ml-auto">{f.especialidade}</span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
