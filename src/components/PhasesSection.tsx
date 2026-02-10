"use client";

import { PROGRAM_PHASES } from "../lib/program-config";

export function PhasesSection() {
  return (
    // z-20 garante que fica ACIMA do Hero quando fazes scroll
    <section className="relative z-20 bg-black text-white py-32 px-12 md:px-24 border-t border-white/10">
      
      {/* Cabeçalho */}
      <div className="mb-24 flex items-end justify-between border-b border-white/10 pb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">
            Cronograma
          </h2>
          <div className="h-1 w-20 bg-white mt-4" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2 text-right">
          Estrutura do Programa 2026<br />
          Ensino Secundário
        </p>
      </div>

      {/* Grelha de 3 Colunas (Focada em Web/Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {PROGRAM_PHASES.map((phase) => (
          <div key={phase.id} className="group space-y-6">
            
            {/* Número da Fase com efeito hover */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-6 group-hover:border-white transition-colors duration-500">
              <span className="text-4xl font-black text-white/20 group-hover:text-white transition-colors duration-500">
                {phase.index}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                Fase
              </span>
            </div>

            {/* Conteúdo */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold uppercase italic tracking-tight text-white group-hover:translate-x-2 transition-transform duration-500">
                {phase.name}
              </h3>
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/60">
                {phase.subtitle}
              </p>
            </div>

            <p className="text-sm text-white/40 leading-relaxed text-justify group-hover:text-white/70 transition-colors duration-500">
              {phase.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}