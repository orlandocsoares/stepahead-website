"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

export function DocumentRepository() {
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (data) setDocuments(data);
    };
    fetchDocs();
  }, []);

  return (
    <section id="documentação" className="py-32 bg-white text-left">
      <div className="max-w-[1800px] mx-auto px-16 md:px-40">
        <div className="max-w-xl mb-24">
          <p className="text-[8px] tracking-[0.7em] text-black/20 uppercase font-bold italic mb-4">Recursos</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black/80">Repositório Digital</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 border border-black/5 hover:border-black/20 transition-all duration-500 bg-neutral-50/30">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-black text-white"><FileText size={16} /></div>
                <button onClick={() => window.open(doc.url, "_blank")} className="text-black/20 hover:text-black transition-colors"><Download size={16} /></button>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-black/80">{doc.title}</h3>
              <p className="text-[11px] text-black/40 leading-relaxed italic mt-2 font-medium">{doc.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}