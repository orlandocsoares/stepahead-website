"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, FileText, School, MapPin, 
  CreditCard, Loader2, CheckCircle, ArrowRight, Lock, Mail
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [role, setRole] = useState<"formando" | "formador">("formando");
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    bi_number: "",
    school: "",
    province: "Luanda",
    cv_summary: ""
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. REGISTO NO SUPABASE AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.first_name,
        }
      }
    });

    if (authError) {
      alert("Erro no registo: " + authError.message);
      setLoading(false);
      return;
    }

    // 2. ATUALIZAÇÃO DO PERFIL (O trigger já criou o perfil, agora preenchemos os detalhes)
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bi_number: formData.bi_number,
          school: formData.school,
          province: formData.province,
          cv_summary: formData.cv_summary,
          role: role,
          status: 'pendente' // Mantém como pendente para aprovação do Jair
        })
        .eq('id', authData.user.id);

      if (!profileError) {
        setIsSuccess(true);
      } else {
        console.error(profileError);
      }
    }
    setLoading(false);
  };

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
          
          {/* SELECTOR DE PERFIL (MUITO IMPORTANTE) */}
          <div className="grid grid-cols-2 gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] backdrop-blur-3xl">
            <button type="button" onClick={() => setRole("formando")} className={`py-6 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all ${role === "formando" ? "bg-white text-black shadow-2xl" : "text-white/20 hover:text-white"}`}>
              Sou Formando
            </button>
            <button type="button" onClick={() => setRole("formador")} className={`py-6 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all ${role === "formador" ? "bg-white text-black shadow-2xl" : "text-white/20 hover:text-white"}`}>
              Sou Formador
            </button>
          </div>

          {/* DADOS PESSOAIS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Nome Próprio</label>
              <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-blue-500/50 transition-all" onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Apelido</label>
              <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm outline-none focus:border-blue-500/50 transition-all" onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
          </section>

          {/* LOGIN */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-white/5 py-12">
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={18} />
              <input type="email" placeholder="EMAIL@EXEMPLO.COM" required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-16 text-xs outline-none focus:border-blue-500" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" size={18} />
              <input type="password" placeholder="PALAVRA-PASSE" required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-16 text-xs outline-none focus:border-blue-500" onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </section>

          {/* DADOS DE IDENTIFICAÇÃO E ESCOLA */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="space-y-3 md:col-span-1">
                <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Nº Bilhete (BI)</label>
                <div className="relative">
                  <CreditCard size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" />
                  <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-xs outline-none" onChange={e => setFormData({...formData, bi_number: e.target.value})} />
                </div>
             </div>
             <div className="space-y-3 md:col-span-2">
                <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Escola / Instituição Parceira</label>
                <div className="relative">
                  <School size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10" />
                  <input required className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 pl-14 text-xs outline-none placeholder:text-white/5" placeholder="NOME DA INSTITUIÇÃO ATUAL" onChange={e => setFormData({...formData, school: e.target.value})} />
                </div>
             </div>
          </section>

          {/* PROVÍNCIA SELECTOR */}
          <section className="space-y-3">
             <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic text-blue-500">Província de Residência</label>
             <div className="flex gap-4">
               {["Luanda", "Bié"].map((prov) => (
                 <button key={prov} type="button" onClick={() => setFormData({...formData, province: prov})} className={`flex-1 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${formData.province === prov ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-white/20'}`}>
                   {prov}
                 </button>
               ))}
             </div>
          </section>

          {/* CV / RESUMO */}
          <section className="space-y-3">
            <label className="text-[8px] uppercase tracking-[0.5em] text-white/30 ml-4 font-black italic">Mini Currículo / Motivação</label>
            <textarea 
              rows={4} required
              placeholder="FALA-NOS UM POUCO DA TUA EXPERIÊNCIA E PORQUE QUERES FAZER PARTE DO PROJECTO..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 text-xs leading-relaxed outline-none focus:border-blue-500 transition-all placeholder:text-white/5"
              onChange={e => setFormData({...formData, cv_summary: e.target.value})}
            />
          </section>

          <button 
            type="submit" disabled={loading}
            className="w-full py-8 bg-white text-black rounded-[2rem] text-[10px] uppercase font-black tracking-[0.5em] hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_50px_rgba(255,255,255,0.05)] flex items-center justify-center gap-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Submeter para Aprovação <ArrowRight size={16}/></>}
          </button>

        </form>

        <footer className="mt-24 text-center">
           <p className="text-[7px] uppercase tracking-[1em] text-white/10 font-black">Projecto Saber Mais Angola // Governação & Educação</p>
        </footer>
      </div>
    </main>
  );
}