"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Calendar, FileText, ShieldCheck, MapPin, 
  ChevronRight, Loader2, Download, BookOpen, GraduationCap, Award
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // REFINAMENTO UNIFORME: Rastreador de Direcção para a Calha de Néon (O Cometa)
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
    fetchData();
    const channel = supabase.channel('db-live').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");
    
    const [prof, st, ag, fl] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('dashboard_stats').select('*').order('provincia'),
      supabase.from('agenda_atividades').select('*').order('data_evento').limit(3),
      supabase.from('arquivos').select('*').order('created_at', { ascending: false }).limit(3)
    ]);

    if (prof.data) setProfile(prof.data);
    if (st.data) setStats(st.data);
    if (ag.data) setAgenda(ag.data);
    if (fl.data) setRecentFiles(fl.data);
    loading && setLoading(false);
  }

  if (loading && !profile) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    // ESTRUTURA GLOBAL: Enquadramento com altura de ecrã limitada e scroll interno
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

      {/* CABEÇALHO FIXO NO TOPO (Focado em Informação de Acesso) */}
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shrink-0">
        <div className="space-y-3 text-left">
   
          <p className="text-[9px] tracking-[0.8em] text-blue-500 uppercase font-black italic">
            User Terminal // {new Date().toLocaleDateString('pt-PT')}
          </p>
          <h1 className="text-5xl font-extralight text-white uppercase tracking-tighter italic leading-none drop-shadow-2xl">
            Olá, <span className="opacity-30 not-italic font-bold">{profile?.first_name}</span>
          </h1>
        </div>
        
 
        <div className="flex items-center gap-6 bg-white/[0.01] border border-white/5 p-4 rounded-2xl backdrop-blur-3xl shadow-xl">
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest text-white/20 font-black">Identidade Operacional</p>
            <p className="text-[10px] uppercase tracking-widest text-blue-500 font-black italic">
              {profile?.role === 'super-admin' ? "Super Admin" : profile?.role === 'formador' ? "Formador Credenciado" : "Formando Activo"}
            </p>
          </div>
          <ShieldCheck className="text-blue-500" size={24} />
        </div>
      </header>

      {/* ÁREA CENTRAL DESLIZANTE COM O SISTEMA COMETA */}
      <div className="flex-1 relative flex gap-8 min-h-0">
        
       
        {/* CONTENTOR DE INFORMAÇÃO OPERACIONAL */}
        <div 
          className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2"
          onScroll={handleScroll}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* PAINEL OPERACIONAL PRINCIPAL (Esquerda) */}
         
            <div className="lg:col-span-8 space-y-8">
              
              {/* CARD DE BOAS-VINDAS CONTEXTUALIZADO (O SALTO DE MESTRE EM UX) */}
              <section className="p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-950/20 via-black/40 to-transparent border border-white/5 backdrop-blur-3xl text-left space-y-4">
                <div className="flex items-center gap-3">
            
                  {profile?.role === 'super-admin' ? (
                    <Award className="text-blue-400 shrink-0" size={18} />
                  ) : profile?.role === 'formador' ? (
                    <BookOpen className="text-emerald-400 shrink-0" size={18} />
                  ) : (
                    <GraduationCap className="text-amber-400 shrink-0" size={18} />
                  )}
              
                  <span className="text-[10px] tracking-widest font-black uppercase text-white/40">Estatuto de Transmissão</span>
                </div>
                
                <h2 className="text-2xl font-light tracking-tight text-white uppercase italic">
                  {profile?.role === 'super-admin' ? (
                    <>Modo de <span className="font-bold text-blue-400">Governação Activo</span></>
                  ) : profile?.role === 'formador' ? (
                    <>Supervisão e <span className="font-bold text-emerald-400">Acompanhamento</span></>
                  ) : (
                    <>Jornada de <span className="font-bold text-amber-400">Capacitação Pedagógica</span></>
                  )}
             
                </h2>
                
                <p className="text-[11px] leading-relaxed text-white/50 tracking-widest uppercase font-light">
                  {profile?.role === 'super-admin' ? (
                    "O teu terminal de administrador dá-te total autoridade para validar candidaturas, autorizar poderes na agenda e gerir os recursos educacionais das províncias."
                  ) : profile?.role === 'formador' ? (
                    "Tens acesso autorizado para analisar relatórios pedagógicos, orientar os formandos nas províncias e submeter novos materiais didácticos de apoio às turmas."
                  ) : (
                    "Fazes parte da rede integrada de educação. O teu objectivo é acompanhar as sessões planeadas na agenda operacional e descarregar os materiais do repositório."
                  )}
                </p>
              </section>

              {/* TELEMETRIA DE MONITORIZAÇÃO (RADAR) */}
              <section className="p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl text-left">
         
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-[11px] uppercase tracking-[0.5em] text-white/40 font-black flex items-center gap-4">
                    <BarChart3 size={18} className="text-blue-500" /> Radar de Integração
                  </h3>
                  <span className="text-[9px] text-white/20 uppercase tracking-widest font-mono italic">Métricas de Cooperação</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {stats.map(s => (
                    <div key={s.id} className="p-8 rounded-3xl bg-black/40 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">
    
                      {/* Efeito luminoso de fundo */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                      
                     
                      <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold mb-3">{s.provincia}</p>
                      <div className="flex items-end gap-6">
                        <span className="text-5xl font-extralight text-white tracking-tighter italic leading-none">{s.valor}%</span>
                        <div className="flex-1 h-[2px] bg-white/5 mb-2 rounded-full overflow-hidden relative">
       
                           <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${s.valor}%` }} 
                
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                          />
                        </div>
  
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            
              {/* BIBLIOTECA DE ACESSO RÁPIDO (RECURSOS RECENTES) */}
              <section className="space-y-6 text-left">
                <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-black italic ml-4">Recursos Recentes Disponibilizados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentFiles.map(f => (
          
                    <a 
                      key={f.id} 
                      href={`/storage/v1/object/public/materiais/${f.nome_arquivo}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-blue-500/40 hover:bg-black/50 transition-all duration-500 group flex flex-col justify-between h-40 shadow-xl"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
       
                           <FileText size={18} />
                        </div>
                        <Download size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                      </div>
    
                      <div className="space-y-1">
                        <p className="text-[10px] text-white uppercase font-bold truncate max-w-full" title={f.label}>{f.label}</p>
                        <p className="text-[7.5px] text-white/20 uppercase tracking-widest font-mono">Cofre Digital</p>
                    
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </div>

            {/* CRONOLOGIA DE EVENTOS (Direita) */}
 
            <div className="lg:col-span-4 w-full">
              <section className="p-8 sm:p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl text-left">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
                  <h3 className="text-[11px] uppercase tracking-[0.5em] text-white/40 font-black flex items-center gap-4">
                
                    <Calendar size={18} className="text-blue-500" /> Agenda Operacional
                  </h3>
                  <span className="text-[8px] text-white/20 font-mono italic">3 Próximos</span>
                </div>

                <div className="space-y-10 relative pl-2">
               
                  {/* Linha vertical de ligação física */}
                  <div className="absolute left-[13px] top-2 bottom-12 w-[1px] bg-white/5" />

                  {agenda.map(a => (
                    <div key={a.id} className="relative pl-10 group cursor-pointer">
                     
                      {/* Ponto de ligação de néon */}
                      <div className="absolute left-1 top-1.5 w-[11px] h-[11px] rounded-full border border-white/20 bg-[#0c0c0e] group-hover:border-blue-500 transition-all duration-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-blue-500 transition-colors" />
                      </div>
   
                     
                      <div className="space-y-2">
                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest font-mono">
                          {new Date(a.data_evento).toLocaleDateString('pt-PT')}
 
                        </p>
                        <h4 className="text-lg font-light text-white uppercase tracking-tighter italic leading-snug group-hover:text-blue-400 transition-colors">
                          {a.titulo}
                  
                        </h4>
                        <p className="text-[8px] text-white/30 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={10} className="text-white/20" /> {a.local}
                        </p>
         
                      </div>
                    </div>
                  ))}

                  {agenda.length === 0 && (
                    <p className="text-[9px] uppercase tracking-widest text-white/20 italic py-10 text-center">
                      Sem actividades planeadas na rede.
                    </p>
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>

        {/* CALHA DE SCROLL NÉON INTEGRADA (O COMETA) */}
 
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
    </div>
  );
}