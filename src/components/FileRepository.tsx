"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Video, Download, Database, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSound } from "@/hooks/useSound";

const AREAS_ENSINO = [
  "Todos",
  "Língua Portuguesa",
  "Matemática",
  "Pré-Escolar",
  "Educação Inclusiva",
  "Expressão Plástica",
  "Expressão Físico-Motora"
];

// --- SUB-COMPONENTE: CARTÃO DE ARQUIVO ---
function FileCard({ doc, index }: { doc: any; index: number }) {
  const { playSound } = useSound();
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = (name: string) => {
    playSound("click");
    const publicURL = `/storage/v1/object/public/materiais/${encodeURIComponent(name)}`;
    window.open(publicURL, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => { setIsHovered(true); playSound("hover"); }}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-blue-500/30 backdrop-blur-3xl transition-all duration-700 flex flex-col justify-between h-64 overflow-hidden"
    >
      <div className="flex justify-between items-start z-10">
        <div className={`p-4 rounded-2xl transition-all duration-700 ${isHovered ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-blue-400'}`}>
          {doc.tipo === 'video' ? <Video size={20} strokeWidth={1.5} /> : <FileText size={20} strokeWidth={1.5} />}
        </div>
        <span className="text-[9px] uppercase tracking-widest text-white/20">{doc.tamanho}</span>
      </div>

      <div className="z-10">
        <p className="text-[9px] text-blue-500 uppercase font-black mb-2 tracking-[0.3em]">{doc.area}</p>
        <h3 className="text-lg font-light text-white leading-tight group-hover:text-blue-100 transition-colors line-clamp-2">
          {doc.label}
        </h3>
      </div>

      <button 
        onClick={() => handleDownload(doc.nome_arquivo)}
        className="absolute bottom-8 right-8 p-3.5 bg-white text-black rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-xl active:scale-90 z-20"
      >
        <Download size={18} />
      </button>

      {/* Brilho de fundo no hover */}
      <div className="absolute -inset-10 bg-blue-500/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-0" />
    </motion.div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function FileRepository() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState("Todos");
  const [query, setQuery] = useState("");
  const { playSound } = useSound();

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      const { data, error } = await supabase
        .from('arquivos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setFiles(data);
      setLoading(false);
    }
    fetchFiles();
  }, []);

  const filtered = files.filter(m => 
    (activeArea === "Todos" || m.area === activeArea) &&
    (m.label?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-16 py-12 px-6 font-sans">
      
      {/* HEADER E PESQUISA */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-12">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.8em] text-white/20 uppercase font-bold italic">Knowledge Base</p>
          <h2 className="text-6xl font-extralight text-white uppercase tracking-tighter leading-none">
            Repositório <span className="opacity-20 italic font-serif">Digital</span>
          </h2>
        </div>
        
        <div className="relative w-full md:w-[400px]">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" />
          <input 
            type="text" placeholder="PROCURAR MANUAL..." 
            className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl pl-16 pr-6 text-[10px] text-white uppercase tracking-widest focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-white/5"
            value={query} onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* FILTROS DE ÁREA */}
      <div className="flex flex-wrap gap-3">
        {AREAS_ENSINO.map(area => (
          <button 
            key={area} onClick={() => { setActiveArea(area); playSound("click"); }}
            className={`px-8 py-4 rounded-xl text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500 border
              ${activeArea === area 
                ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                : 'bg-transparent border-white/5 text-white/30 hover:border-white/20 hover:text-white'}`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
           <Loader2 size={32} className="animate-spin text-blue-500/50" strokeWidth={1} />
           <p className="text-[8px] uppercase tracking-[1em] text-white/10">Acedendo aos Arquivos...</p>
        </div>
      ) : filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((doc, i) => (
              <FileCard key={doc.id} doc={doc} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center border border-dashed border-white/5 rounded-[3rem]">
           <AlertCircle size={40} className="mx-auto text-white/5 mb-6" strokeWidth={1} />
           <p className="text-[9px] uppercase tracking-[0.5em] text-white/20">Nenhum registo encontrado em "{activeArea}"</p>
           <button onClick={() => setActiveArea("Todos")} className="mt-8 text-blue-500 text-[9px] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 mx-auto">
             Restaurar Filtros <ArrowRight size={12} />
           </button>
        </motion.div>
      )}
    </div>
  );
}