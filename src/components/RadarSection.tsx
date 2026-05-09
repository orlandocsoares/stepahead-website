"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Radio } from "lucide-react";

export function RadarSection() {
  const [activeProvincia, setActiveProvincia] = useState("Luanda");
  const [stats, setStats] = useState<{ [key: string]: number }>({ "Luanda": 0, "Bié": 0 });
  const [loading, setLoading] = useState(true);

  // BUSCAR DADOS REAIS DO SUPABASE
  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.from('dashboard_stats').select('provincia, valor');
      if (data) {
        const map = data.reduce((acc: any, curr: any) => {
          acc[curr.provincia] = curr.valor;
          return acc;
        }, {});
        setStats(map);
      }
      setLoading(false);
    }
    fetchStats();

    // ESCUTA EM TEMPO REAL (Se mudares no Admin, muda aqui na hora!)
    const channel = supabase.channel('stats-changes')
      .on('postgres_changes', { event: 'UPDATE', table: 'dashboard_stats', schema: 'public' }, 
      () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-20 px-10">
      <div className="flex justify-between items-start mb-20">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-blue-500 uppercase font-black mb-2">Impact Monitoring // 2026</p>
          <h2 className="text-6xl font-light text-white uppercase tracking-tighter">
            Radar <span className="italic opacity-40 serif">Tático</span>
          </h2>
        </div>

        {/* SELECTOR DE PROVÍNCIA */}
        <div className="flex gap-4 bg-white/5 p-2 rounded-full border border-white/5">
          {["Luanda", "Bié"].map((p) => (
            <button
              key={p}
              onClick={() => setActiveProvincia(p)}
              className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                activeProvincia === p ? "bg-white text-black" : "text-white/20 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative flex justify-center items-center h-[400px]">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[300px] h-[300px] rounded-full border border-blue-500/30 blur-2xl" 
          />
          <div className="text-center z-10">
            <Radio className="mx-auto mb-6 text-blue-500 animate-pulse" size={32} />
            <h3 className="text-4xl font-light text-white uppercase tracking-[0.3em]">{activeProvincia}</h3>
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mt-4">Scanning Province</p>
          </div>
        </div>

        {/* O CARD DO VALOR (A "SETA" AGORA É UM BOTÃO DE DETALHES) */}
        <div className="bg-white/[0.03] border border-white/5 rounded-[4rem] p-16 relative overflow-hidden group">
          <div className="relative z-10 flex justify-between items-center">
            <AnimatePresence mode="wait">
              <motion.span 
                key={activeProvincia}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-[120px] font-light text-white leading-none tracking-tighter"
              >
                {loading ? "..." : stats[activeProvincia] || 0}
              </motion.span>
            </AnimatePresence>
            
            <button className="p-6 rounded-full bg-white/5 border border-white/10 text-white/20 group-hover:text-blue-500 group-hover:border-blue-500/50 transition-all duration-700">
              <ChevronRight size={40} strokeWidth={1} />
            </button>
          </div>
          
          <div className="mt-10 border-t border-white/5 pt-10">
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 italic">View Regional Map Data</p>
          </div>
        </div>
      </div>
    </div>
  );
}