"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export function AgendaSection() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgenda = async () => {
      const { data } = await supabase.from('program_agenda').select('*').order('order_index', { ascending: true });
      if (data) setItems(data);
    };
    fetchAgenda();
  }, []);

  return (
    <section id="agenda" className="py-32 bg-white text-left">
      <div className="max-w-[1800px] mx-auto px-16 md:px-40">
        <div className="max-w-xl mb-24">
          <p className="text-[8px] tracking-[0.7em] text-black/20 uppercase font-bold italic mb-4">Cronograma</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Agenda do Programa</h2>
        </div>
        <div className="grid gap-16">
          {items.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex gap-12 md:gap-24 items-start border-b border-black/5 pb-12 group">
              <span className="text-xl font-black tabular-nums text-black/10 italic group-hover:text-black transition-colors duration-500">{item.time_start}</span>
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-widest">{item.title}</h3>
                <p className="text-xs text-black/40 leading-relaxed max-w-sm font-medium italic">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}