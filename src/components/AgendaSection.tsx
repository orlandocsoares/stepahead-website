
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
    <section id="agenda" className="relative z-20 bg-black text-white py-32 px-12 md:px-24 border-t border-white/10">
      <div className="max-w-[1800px] mx-auto">
        {/* Cabeçalho inspirado no estilo das Fases */}
        <div className="mb-24 flex items-end justify-between border-b border-white/10 pb-8">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">
              Agenda do Programa
            </h2>
            <div className="h-1 w-20 bg-white mt-4" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 text-right">
            Sessões e Eventos<br />
            Plataforma Saber Mais
          </p>
        </div>

        {/* Grelha de 3 Colunas (Focada em Web/Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              className="group space-y-6"
            >
              {/* Indicador de Horário com efeito hover */}
              <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-6 group-hover:border-white transition-colors duration-500">
                <span className="text-2xl font-black text-white/20 group-hover:text-white transition-colors duration-500 tabular-nums">
                  {item.time_start}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                  Horário
                </span>
              </div>

              {/* Título da Actividade */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold uppercase italic tracking-tight text-white group-hover:translate-x-2 transition-transform duration-500">
                  {item.title}
                </h3>
              </div>

              {/* Descrição */}
              <p className="text-sm text-white/40 leading-relaxed text-justify group-hover:text-white/70 transition-colors duration-500 font-medium italic">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
