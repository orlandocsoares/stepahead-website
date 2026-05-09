"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Calendar, FileText, ShieldCheck, MapPin, ChevronRight, Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    setLoading(false);
  }

  if (loading && !profile) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto py-20 px-10 md:pl-48 min-h-screen bg-transparent selection:bg-blue-500/30">
      <header className="mb-16 flex justify-between items-end">
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.8em] text-blue-500 uppercase font-black italic">User Terminal // {new Date().toLocaleDateString('pt-PT')}</p>
          <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none">Olá, <span className="opacity-20 not-italic">{profile?.first_name}</span></h1>
        </div>
        <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-3xl">
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-widest text-white/20 font-black">Acesso</p>
            <p className="text-[10px] uppercase tracking-widest text-blue-500 font-black italic">{profile?.role}</p>
          </div>
          <ShieldCheck className="text-blue-500" size={24} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="p-10 rounded-[3.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl">
            <h3 className="text-[11px] uppercase tracking-[0.5em] text-white/40 font-black mb-10 flex items-center gap-4"><BarChart3 size={18} /> Radar Operacional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.map(s => (
                <div key={s.id} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 mb-2">{s.provincia}</p>
                  <div className="flex items-end gap-4">
                    <span className="text-5xl font-extralight text-white tracking-tighter italic">{s.valor}%</span>
                    <div className="flex-1 h-[2px] bg-white/5 mb-3 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.valor}%` }} className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-black italic ml-4">Materiais Recentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentFiles.map(f => (
                <a key={f.id} href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materiais/${f.nome_arquivo}`} target="_blank" className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-blue-500/50 transition-all group">
                  <FileText size={20} className="text-white/20 group-hover:text-blue-500 mb-4 transition-colors" />
                  <p className="text-[10px] text-white uppercase font-black truncate">{f.label}</p>
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <section className="p-10 rounded-[3.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl h-full">
            <h3 className="text-[11px] uppercase tracking-[0.5em] text-white/40 font-black mb-10 pb-6 border-b border-white/5 flex items-center gap-4"><Calendar size={18} /> Agenda</h3>
            <div className="space-y-10">
              {agenda.map(a => (
                <div key={a.id} className="relative pl-8 border-l border-white/5 group">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-blue-500 transition-all" />
                  <p className="text-[9px] text-blue-500 font-black uppercase">{new Date(a.data_evento).toLocaleDateString('pt-PT')}</p>
                  <h4 className="text-lg font-light text-white uppercase tracking-tighter italic">{a.titulo}</h4>
                  <p className="text-[8px] text-white/20 uppercase tracking-widest flex items-center gap-2 mt-2"><MapPin size={10} /> {a.local}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}