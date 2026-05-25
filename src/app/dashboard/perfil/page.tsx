"use client";

import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, ShieldCheck, Save, Loader2, Camera, 
  Key, FileText, CheckCircle2, AlertCircle, Activity,
  Award, Laptop
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const { profile, loading } = useProfile(); 
  const [localProfile, setLocalProfile] = useState<any>(null);
  
  // Estados de Interface
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [password, setPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // REFINAMENTO DE MESTRE: Rastreador de Direcção para a Calha de Néon
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

  useEffect(() => {
    if (profile) setLocalProfile({ ...profile });
  }, [profile]);

  // FUNÇÕES DE BASE (Intactas)
  const handleSaveProfile = async () => {
    if (!localProfile?.id) return;
    setMessage(null);

    if (localProfile.role === 'formador' && (!localProfile.biografia || localProfile.biografia.trim() === '')) {
      setMessage({ type: 'error', text: 'Como Formador, é obrigatório preencher a sua Biografia Profissional.' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: localProfile.first_name,
        last_name: localProfile.last_name,
        specialization: localProfile.specialization,
        province: localProfile.province,
        biografia: localProfile.biografia
      }).eq('id', localProfile.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Identidade Operacional actualizada com sucesso.' });
    } catch (err: any) { 
      setMessage({ type: 'error', text: err.message || 'Erro ao gravar dados.' });
    } finally { 
      setIsSaving(false); 
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      return;
    }
    setIsSavingPassword(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Credenciais de segurança actualizadas. O cofre está trancado.' });
      setPassword("");
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao actualizar segurança.' });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !localProfile?.id) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${localProfile.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', localProfile.id);

      if (updateError) throw updateError;

      setLocalProfile({ ...localProfile, avatar_url: avatarUrl });
      setMessage({ type: 'success', text: 'Fotografia de perfil actualizada.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao carregar imagem. Verifique as permissões do bucket.' });
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading || !localProfile) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    // ESTRUTURA PRINCIPAL: Flexbox para isolar o Cabeçalho Fixo do Contentor Deslizante
    <div className="h-screen flex flex-col max-w-6xl mx-auto pt-24 pb-10 px-4 md:px-10 md:pl-48 relative z-10 selection:bg-blue-500/30">
      
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

      {/* MENSAGENS DE FEEDBACK */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-10 right-10 z-50 p-6 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-3xl border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-[10px] uppercase font-black tracking-widest">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECÇÃO 1: CABEÇALHO FIXO NO TOPO */}
      <div className="shrink-0 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center gap-12">
          
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-44 h-44 rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl flex items-center justify-center shadow-2xl overflow-hidden relative transition-all duration-500 group-hover:border-blue-500/50 ${isUploadingAvatar ? 'opacity-50' : ''}`}>
              {localProfile.avatar_url ? (
                <img src={localProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={80} strokeWidth={0.5} className="text-white/10" />
              )}
              <div className="absolute inset-0 bg-blue-600/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {isUploadingAvatar ? <Loader2 className="animate-spin text-white" size={24} /> : <Camera className="text-white mb-2" size={24} />}
                <span className="text-[9px] uppercase tracking-widest text-white font-black">{isUploadingAvatar ? 'A Carregar...' : 'Alterar Foto'}</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <div className="text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
              <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] uppercase tracking-[0.3em] text-blue-400 font-black italic">
                {localProfile.role === 'super-admin' ? "Administrador de Elite" : localProfile.role === 'formador' ? "Formador Credenciado" : "Formando Activo"}
              </div>
              <div className={`px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-[0.3em] font-black italic flex items-center gap-2 ${
                localProfile.status === 'aprovado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <Activity size={10} /> Estatuto: {localProfile.status || 'Pendente'}
              </div>
            </div>
            <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
              {localProfile.first_name || 'Utilizador'} <span className="font-bold opacity-40">{localProfile.last_name || ''}</span>
            </h1>
            <p className="text-white/20 text-[10px] uppercase tracking-[0.6em] font-light italic">Saber Mais Angola // III Ciclo</p>
          </div>
        </motion.div>
      </div>

      {/* ESTRUTURA INFERIOR: Calha de Scroll e Contentor de Vidro */}
      <div className="flex-1 relative flex gap-8 min-h-0">
        
        {/* A ÁREA DE SCROLL DOS CONTENTORES DE VIDRO */}
        <div 
          className="flex-1 overflow-y-auto hide-native-scroll pb-10"
          onScroll={handleScroll}
        >
          <div className="space-y-12">
            {/* CAIXA DE IDENTIDADE */}
            <div className="p-10 md:p-12 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl space-y-12 shadow-2xl">
              <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/30 flex items-center gap-4 font-black italic pb-6 border-b border-white/5">
                 <FileText size={16} className="text-blue-500" /> Parâmetros de Identidade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">Nome Próprio</label>
                  <input 
                    value={localProfile.first_name || ''} 
                    onChange={e => setLocalProfile({...localProfile, first_name: e.target.value})}
                    className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">Apelido</label>
                  <input 
                    value={localProfile.last_name || ''} 
                    onChange={e => setLocalProfile({...localProfile, last_name: e.target.value})}
                    className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">E-mail de Acesso (Imutável)</label>
                  <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-[11px] text-white/40 font-mono italic cursor-not-allowed">
                    {localProfile.email}
                  </div>
                </div>
                <div className="space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">Província Operacional</label>
                  <select 
                    value={localProfile.province || ''} 
                    onChange={e => setLocalProfile({...localProfile, province: e.target.value})}
                    className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900 text-white">Seleccione a Província...</option>
                    <option value="Luanda" className="bg-zinc-900 text-white">Luanda</option>
                    <option value="Bié" className="bg-zinc-900 text-white">Bié</option>
                  </select>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">Especialização</label>
                  <input 
                    value={localProfile.specialization || ''} 
                    onChange={e => setLocalProfile({...localProfile, specialization: e.target.value})}
                    className="w-full p-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-white uppercase tracking-widest outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Ex: Engenharia de Planeamento"
                  />
                </div>
              </div>

              <div className="space-y-3 text-left pt-4">
                <label className="text-[8px] uppercase tracking-[0.3em] ml-2 flex items-center justify-between">
                  <span className="text-white/20">Biografia Profissional</span>
                  {localProfile.role === 'formador' && (
                    <span className="text-amber-500 font-black animate-pulse">* Preenchimento Obrigatório</span>
                  )}
                </label>
                <textarea 
                  value={localProfile.biografia || ''}
                  onChange={e => setLocalProfile({...localProfile, biografia: e.target.value})}
                  placeholder="Partilhe um breve resumo da sua jornada técnica e pedagógica..."
                  className={`w-full p-5 bg-white/[0.02] border rounded-2xl text-xs text-white/80 outline-none transition-colors min-h-[120px] resize-y ${
                    localProfile.role === 'formador' && (!localProfile.biografia || localProfile.biografia.trim() === '') 
                    ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] focus:border-amber-400' 
                    : 'border-white/10 focus:border-blue-500/50'
                  }`}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving} 
                  className="px-10 py-5 rounded-[2rem] bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center gap-4 group border-0"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                  Gravar Configuração
                </button>
              </div>
            </div>

            {/* CAIXAS DE DESEMPENHO E SEGURANÇA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl space-y-6 text-left shadow-2xl">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/30 flex items-center gap-3 font-bold">
                  <Award size={14} className="text-amber-500" /> Nível de Capacitação
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] uppercase tracking-widest text-white/40">Guia Pedagógico III</span>
                    <span className="text-2xl font-light italic text-white">85% Concluído</span>
                  </div>
                  <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <p className="text-[8px] uppercase tracking-widest leading-relaxed text-white/20 italic">
                  Este gráfico representa o seu progresso de integração metodológica no projecto Saber Mais Angola.
                </p>
              </div>

              <div className="p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl space-y-6 text-left shadow-2xl flex flex-col justify-between">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/30 flex items-center gap-3 font-bold">
                  <Laptop size={14} className="text-blue-500" /> Segurança do Dispositivo
                </h4>
                <div className="space-y-2 font-mono text-[9px] text-white/50 uppercase tracking-widest">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Plataforma</span>
                    <span className="text-blue-400">Activa (Web Terminal)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Estatuto de Sessão</span>
                    <span className="text-emerald-400">Encriptada (SSL)</span>
                  </div>
                </div>
                <p className="text-[8px] uppercase tracking-widest leading-relaxed text-white/20 italic">
                  Conexão segura autorizada directamente através dos servidores descentralizados da rede.
                </p>
              </div>
            </div>

            {/* O COFRE DA PALAVRA-PASSE */}
            <div className="p-10 md:p-12 rounded-[3.5rem] bg-black/40 border border-white/5 backdrop-blur-3xl space-y-8 shadow-2xl">
              <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/30 flex items-center gap-4 font-black italic pb-6 border-b border-white/5">
                 <ShieldCheck size={16} className="text-emerald-500" /> Protocolo de Segurança
              </h3>
              
              <div className="flex flex-col md:flex-row gap-8 items-end">
                <div className="w-full flex-1 space-y-3 text-left">
                  <label className="text-[8px] uppercase text-white/20 tracking-[0.3em] ml-2">Nova Palavra-Passe</label>
                  <div className="relative group">
                    <Key size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Introduza a nova chave de acesso..."
                      className="w-full p-5 pl-14 bg-white/[0.01] border border-white/10 rounded-2xl text-xs text-white tracking-widest outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors placeholder:uppercase placeholder:text-[10px]"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleUpdatePassword} 
                  disabled={isSavingPassword || !password} 
                  className="w-full md:w-auto px-10 py-5 rounded-[2rem] border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500/10 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
                >
                  {isSavingPassword ? <Loader2 className="animate-spin" size={16} /> : "Trancar Cofre"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* A CALHA DE NÉON (O COMETA) */}
        {/* Encontra-se exactamente ao lado do contentor deslizante, partilhando a mesma altura de limite a limite */}
        <div className="w-[3px] rounded-full bg-white/[0.02] relative overflow-hidden shrink-0 hidden md:block">
          <motion.div
            key={scrollDirection} // Força o re-render puro da animação quando muda de direcção
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
    </div>
  );
}