
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function AgendaSection() {
  const [items, setItems] = useState<any[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Efeito Parallax: monitoriza o scroll em relação a esta secção
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Transformação para o movimento de parallax do conteúdo
  const yParallax = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const smoothY = useSpring(yParallax, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const fetchAgenda = async () => {
      const { data } = await supabase.from('program_agenda').select('*').order('order_index', { ascending: true });
      if (data) setItems(data);
    };
    fetchAgenda();
  }, []);

  return (
    <section 
      ref={sectionRef}
      id="agenda" 
      className="relative z-20 bg-[#000033] text-white py-12 px-16 md:px-40 border-t border-white/10 overflow-hidden"
    >
      <div className="max-w-[1800px] mx-auto">
        {/* Cabeçalho */}
        <div className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
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

        {/* Grelha de Actividades com Parallax */}
        <motion.div 
          style={{ y: smoothY }}
          className="grid grid-cols-1 md:grid-cols-3 gap-16"
        >
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              className="group space-y-6"
            >
              {/* Indicador de Horário */}
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
        </motion.div>
      </div>
    </section>
  );
}
