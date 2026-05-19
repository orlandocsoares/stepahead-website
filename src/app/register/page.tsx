"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, FileText, School, MapPin, 
  CreditCard, Loader2, CheckCircle, ArrowRight, Lock, Mail, Camera, QrCode, Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [role, setRole] = useState<"formando" | "formador">("formando");
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"local" | "qr">("local");
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    // Campos de Formando
    bi_number: "",
    school: "",
    province: "Luanda",
    cv_summary: "",
    // Campos de Formador
    specialty: "",
    gender: "Feminino",
    bio: ""
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);

  // 1. Gerar ID de sessão único para o acoplamento do QR Code
  useEffect(() => {
    const uniqueId = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    setSessionId(uniqueId);
  }, []);

  // 2. Escuta em tempo real (Supabase Broadcast) para receber a foto do telemóvel
  useEffect(() => {
    if (!sessionId || role !== 'formador') return;

    const channel = supabase.channel(`camera-${sessionId}`);
    
    channel
      .on('broadcast', { event: 'photo_captured' }, (payload: any) => {
        if (payload.payload?.url) {
          setAvatarPreview(payload.payload.url);
          setRemoteImageUrl(payload.payload.url);
          setUploadMode("local"); // Minimiza o QR Code após o sucesso
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, role]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoteImageUrl(null); // Anula rota remota se carregar ficheiro local
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação estrita para o Formador
    if (role === 'formador' && !avatarPreview) {
      alert("Por favor, capture ou carregue uma fotografia de perfil obrigatória.");
      return;
    }

    setLoading(true);

    // 1. REGISTO NO SUPABASE AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.first_name,
          role: role
        }
      }
    });

    if (authError) {
      alert("Erro no registo: " + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      let finalAvatarUrl = remoteImageUrl;

      // Se tiver carregado ficheiro local (PC/Webcam directa no PC)
      if (role === 'formador' && avatarFile && !finalAvatarUrl) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`formadores/${fileName}`, avatarFile);
          
        if (!uploadError && uploadData) {
          finalAvatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${uploadData.path}`;
        }
      }

      // 3. ACTUALIZAÇÃO DO PERFIL NA BASE DE DADOS
      const profilePayload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: role,
        status: 'pendente'
      };

      if (role === 'formando') {
        profilePayload.bi_number = formData.bi_number;
        profilePayload.school = formData.school;
        profilePayload.province = formData.province;
        profilePayload.cv_summary = formData.cv_summary;
      } else {
        profilePayload.especialidade = formData.specialty;
        profilePayload.genero = formData.gender;
        profilePayload.biografia = formData.bio;
        if (finalAvatarUrl) profilePayload.avatar_url = finalAvatarUrl;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', authData.user.id);

      if (!profileError) {
        setIsSuccess(true);
      } else {
        console.error("Erro ao actualizar perfil:", profileError);
        alert("Erro ao gravar perfil.");
      }
    }
    setLoading(false);
  };

  // Determinar o link que o telemóvel vai abrir ao ler o QR Code
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrCodeUrl = `${origin}/camera/${sessionId}`;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center font-sans">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md space-y-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-green-500/30">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1 className="text-4xl font-extralight text-white uppercase tracking-tighter italic">Candidatura Recebida</h1>
          <p className="text-white/40 text-sm leading-relaxed tracking-widest uppercase">
            Obrigado, <span className="text-white">{formData.first_name}</span>. Os teus dados foram enviados para o Centro de Controlo. O administrador irá validar o teu acesso em breve.
          </p>
          <button onClick={() => router.push('/')} className="px-10 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-blue-600 hover:text-white transition-all">
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-24 px-6 font-sans overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        
        {/* CABEÇALHO */}
        <header className="text-center mb-16 space-y-4">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] tracking-[1em] text-blue-500 uppercase font-black italic">
            Admissão Saber Mais // 2026
          </motion.p>
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-6xl font-extralight uppercase tracking-tighter leading-none">
            Nova <span className="opacity-20 italic">Inscrição</span>
          </motion.h2>
        </header>

        <form onSubmit={handleRegister} className="space-y-12">
          
          {/* SELECTOR DE PERFIL */}
          <div className="grid grid-cols-2 gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-3xl relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-2 w-[calc(50%-12px)] bg-white rounded-[1.5rem] shadow-2xl z-0"
              animate={{ left: role === "formando" ? "8px" : "calc(50% + 4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button type="button" onClick={() => setRole("formando")} className={`relative z-10 py-6 text-[10px] uppercase font-black tracking-widest transition-colors ${role === "formando" ? "text-black" : "text-white/40 hover:text-white"}`}>
              Sou Formando
            </button>
            <button type="button" onClick={() => setRole("formador")} className={`relative z-10 py-6 text-[10px] uppercase font-black tracking-widest transition-colors ${role === "formador" ? "text-black" : "text-white/40 hover:text-white"}`}>
              Sou Formador
            </button>
          </div>

          {/* DADOS BÁSICOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Nome Próprio</label>
              <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-blue-500/50 transition-all" onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Apelido</label>
              <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-blue-500/50 transition-all" onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <div className="relative md:col-span-1">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={18} />
              <input type="email" placeholder="EMAIL DE CONTACTO" required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-16 text-xs outline-none focus:border-blue-500" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative md:col-span-1">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={18} />
              <input type="password" placeholder="PALAVRA-PASSE" required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-16 text-xs outline-none focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </section>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* VISTA DE FORMANDO */}
          {role === 'formando' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-12">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3 md:col-span-1">
                  <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Nº Bilhete (BI)</label>
                  <div className="relative">
                    <CreditCard size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" />
                    <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-xs outline-none focus:border-blue-500" onChange={e => setFormData({...formData, bi_number: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Escola / Instituição Parceira</label>
                  <div className="relative">
                    <School size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" />
                    <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-xs outline-none focus:border-blue-500 placeholder:text-white/10" placeholder="NOME DA INSTITUIÇÃO ATUAL" onChange={e => setFormData({...formData, school: e.target.value})} />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-[8px] uppercase tracking-[0.5em] text-blue-500 ml-4 font-black italic">Província de Residência</label>
                <div className="flex gap-4">
                  {["Luanda", "Bié"].map((prov) => (
                    <button key={prov} type="button" onClick={() => setFormData({...formData, province: prov})} className={`flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.province === prov ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/5 border-white/5 text-white/30'}`}>
                      {prov}
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Motivação</label>
                <textarea 
                  rows={3} required
                  placeholder="PORQUE QUERES FAZER PARTE DO PROJECTO SABER MAIS?"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 text-xs leading-relaxed outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                  onChange={e => setFormData({...formData, cv_summary: e.target.value})}
                />
              </section>
            </motion.div>
          )}

          {/* VISTA DE FORMADOR (SISTEMA QR CODE INTEGRADO) */}
          {role === 'formador' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-12">
              
              <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  
                  {/* Zona de Visualização do Avatar */}
                  <div className="relative group shrink-0">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all ${avatarPreview ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-dashed border-white/20 bg-white/5 hover:border-white/50'}`}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/30 group-hover:text-white/60">
                          <Camera size={24} />
                        </div>
                      )}
                    </div>
                    {uploadMode === "local" && (
                      <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
                    )}
                  </div>

                  {/* Detalhes e selectores de modo de upload */}
                  <div className="text-center md:text-left space-y-4 flex-1">
                    <div>
                      <h3 className="text-lg font-medium text-white">Fotografia de Perfil</h3>
                      <p className="text-xs text-white/40 leading-relaxed max-w-sm mt-1">
                        Obrigatório para alimentar o carrossel da página principal. Escolha como prefere capturar a sua imagem.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-center md:justify-start">
                      <button type="button" onClick={() => setUploadMode("local")} className={`px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${uploadMode === 'local' ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-white/40'}`}>
                        <Camera size={12} /> Dispositivo Local
                      </button>
                      <button type="button" onClick={() => setUploadMode("qr")} className={`px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${uploadMode === 'qr' ? 'bg-emerald-500 text-black border-emerald-500 shadow-md' : 'bg-transparent border-white/10 text-white/40'}`}>
                        <QrCode size={12} /> Usar Telemóvel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ecrã dinâmico do QR Code Handoff */}
                <AnimatePresence mode="wait">
                  {uploadMode === "qr" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="bg-white p-3 rounded-xl shrink-0 shadow-2xl">
                        <QRCodeSVG value={qrCodeUrl} size={130} level="M" />
                      </div>
                      <div className="space-y-2 text-center md:text-left">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest font-black inline-block animate-pulse">
                          Aguardando Ligação Remota...
                        </span>
                        <h4 className="text-xs font-bold text-white flex items-center justify-center md:justify-start gap-1">
                          <Smartphone size={14} /> Sistema QR Handoff Activo
                        </h4>
                        <p className="text-[11px] text-white/40 leading-relaxed max-w-md">
                          Aponte a câmara do seu telemóvel para o código QR à esquerda. Irá abrir uma página segura que activará a sua câmara frontal para tirar uma selfie rápida. A foto aparecerá aqui no PC automaticamente.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[8px] uppercase tracking-[0.5em] text-emerald-400 ml-4 font-black italic">Género</label>
                  <div className="flex gap-4">
                    {["Feminino", "Masculino", "Outro"].map((gen) => (
                      <button key={gen} type="button" onClick={() => setFormData({...formData, gender: gen})} className={`flex-1 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.gender === gen ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)]' : 'bg-white/5 border-white/5 text-white/30'}`}>
                        {gen}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[8px] uppercase tracking-[0.5em] text-emerald-400 ml-4 font-black italic">Especialidade / Área Pedagógica</label>
                  <input required placeholder="EX: MATEMÁTICA E FÍSICA" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs outline-none focus:border-emerald-500 transition-all placeholder:text-white/10 uppercase" onChange={e => setFormData({...formData, specialty: e.target.value})} />
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-[8px] uppercase tracking-[0.5em] text-emerald-400 ml-4 font-black italic">Síntese Biográfica</label>
                <textarea 
                  rows={3} required
                  placeholder="ESCREVA UM BREVE RESUMO DO SEU PERFIL PROFISSIONAL PARA APRESENTAÇÃO PÚBLICA NA HERO..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 text-xs leading-relaxed outline-none focus:border-emerald-500 transition-all placeholder:text-white/10"
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                />
                <p className="text-[8px] text-white/30 uppercase tracking-widest text-right mr-4">Máximo aconselhado: 200 caracteres</p>
              </section>
            </motion.div>
          )}

          <button 
            type="submit" disabled={loading}
            className={`w-full py-8 text-black rounded-[2rem] text-[10px] uppercase font-black tracking-[0.5em] transition-all flex items-center justify-center gap-4 ${role === 'formador' ? 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_20px_50px_rgba(52,211,153,0.15)]' : 'bg-white hover:bg-blue-600 hover:text-white shadow-[0_20px_50px_rgba(255,255,255,0.05)]'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Submeter Inscrição de {role} <ArrowRight size={16}/></>}
          </button>

        </form>

        <footer className="mt-24 text-center">
           <p className="text-[7px] uppercase tracking-[1em] text-white/10 font-black">Projecto Saber Mais Angola // Governação & Educação</p>
        </footer>
      </div>
    </main>
  );
}