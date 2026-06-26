"use client";

import { useAdminUser } from "@/hooks/useAdminUser";
import {
  User, ShieldCheck, Save, Loader2, Camera,
  Key, FileText, CheckCircle2, AlertCircle, Activity, Award,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PerfilPage() {
  const { user, loading } = useAdminUser();
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [password, setPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) setLocalProfile({ ...user }); }, [user]);

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
      const avatarUrl = `/storage/avatars/${fileName}`;
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
    localProfile.role === "admin" ? "Administrador de Elite"
    : localProfile.role === "formador" ? "Formador Credenciado"
    : "Formando Activo";

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
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Avatar */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-24 h-24 rounded-full border-2 border-white/10 bg-white/[0.04] flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/50 ${isUploadingAvatar ? "opacity-50" : ""}`}>
              {localProfile.avatar_url
                ? <img src={localProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-white/20">{initial}</span>
              }
              <div className="absolute inset-0 bg-blue-600/80 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar
                  ? <Loader2 className="animate-spin text-white" size={20} />
                  : <Camera className="text-white" size={20} />
                }
                <span className="text-[9px] text-white font-bold mt-1">Alterar</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-white">
              {localProfile.first_name} <span className="text-white/40">{localProfile.last_name}</span>
            </h2>
            <p className="text-sm text-white/30 mt-0.5">{localProfile.email}</p>
            <p className="text-[10px] text-white/20 tracking-widest uppercase mt-1">Saber Mais Angola // III Ciclo</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {roleLabel}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium flex items-center gap-1.5 ${
                localProfile.status === "aprovado"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                <Activity size={11} /> Estatuto: {localProfile.status || "pendente"}
              </span>
            </div>
          </div>

          {/* Progresso */}
          <div className="hidden lg:block shrink-0 w-48 space-y-2">
            <div className="flex justify-between text-xs text-white/30">
              <span className="flex items-center gap-1"><Award size={11} /> Capacitação</span>
              <span className="text-white/60">85%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" style={{ width: "85%" }} />
            </div>
            <p className="text-[10px] text-white/20">Guia Pedagógico III</p>
          </div>
        </div>
      </div>

      {/* ── Dados de identidade ── */}
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText size={15} className="text-blue-400" /> Dados de identidade
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Nome próprio</label>
            <input
              value={localProfile.first_name || ""}
              onChange={e => setLocalProfile({ ...localProfile, first_name: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Apelido</label>
            <input
              value={localProfile.last_name || ""}
              onChange={e => setLocalProfile({ ...localProfile, last_name: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">E-mail (imutável)</label>
            <div className="px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-white/30 cursor-not-allowed font-mono">
              {localProfile.email}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40">Província</label>
            <select
              value={localProfile.province || ""}
              onChange={e => setLocalProfile({ ...localProfile, province: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="" className="bg-[#0d0d14]">Seleccionar...</option>
              <option value="Luanda" className="bg-[#0d0d14]">Luanda</option>
              <option value="Bié" className="bg-[#0d0d14]">Bié</option>
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs text-white/40 flex items-center justify-between">
              <span>Especializações</span>
              <span className="text-white/20 text-[10px]">determina o acesso aos ficheiros · clica para seleccionar</span>
            </label>
            {/* Guardado como JSON array em profiles.specialization — controla acesso em ficheiros/page.tsx */}
            {(() => {
              const AREAS = ["Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];
              let selected: string[] = [];
              // Compatibilidade com formato antigo (string simples)
              try { selected = JSON.parse(localProfile.specialization || "[]"); } catch { selected = localProfile.specialization ? [localProfile.specialization] : []; }
              const toggle = (area: string) => {
                const next = selected.includes(area) ? selected.filter(a => a !== area) : [...selected, area];
                setLocalProfile({ ...localProfile, specialization: JSON.stringify(next) });
              };
              return (
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(area => {
                    const active = selected.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggle(area)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                            : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/60 hover:border-white/10"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                  {selected.length === 0 && (
                    <p className="text-[10px] text-white/20 self-center ml-1">Nenhuma seleccionada — acesso a todas as áreas</p>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs text-white/40 flex items-center justify-between">
              <span>Biografia profissional</span>
              {localProfile.role === "formador" && (
                <span className="text-amber-400 text-[10px]">* Obrigatório para formadores</span>
              )}
            </label>
            <textarea
              value={localProfile.biografia || ""}
              onChange={e => setLocalProfile({ ...localProfile, biografia: e.target.value })}
              rows={4}
              placeholder="Partilhe um breve resumo da sua jornada..."
              className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 outline-none transition-colors resize-y min-h-[100px] ${
                localProfile.role === "formador" && !localProfile.biografia?.trim()
                  ? "border-amber-500/40 focus:border-amber-400"
                  : "border-white/[0.06] focus:border-blue-500/50"
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
          </button>
        </div>
      </div>

      {/* ── Segurança ── */}
      <div className="bg-[#13131f] border border-white/[0.06] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-400" /> Segurança
        </h3>
        <p className="text-xs text-white/30">Actualiza a tua palavra-passe de acesso ao backoffice.</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs text-white/40">Nova palavra-passe</label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={isSavingPassword || !password}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-emerald-500/30 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isSavingPassword ? <Loader2 size={14} className="animate-spin" /> : null}
            Actualizar
          </button>
        </div>
      </div>

    </div>
  );
}
