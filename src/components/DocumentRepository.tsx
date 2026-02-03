
"use client";

import { FileText, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DOCUMENTS = [
  {
    id: 1,
    title: "Manual de Apoio Pedagógico v2.1",
    category: "Recurso Didático",
    format: "PDF",
    size: "4.2 MB",
    restricted: false,
  },
  {
    id: 2,
    title: "Guia de Avaliação de Portfólios",
    category: "Normativo",
    format: "PDF",
    size: "1.8 MB",
    restricted: true,
  },
  {
    id: 3,
    title: "Apresentação: Metodologias Inovadoras",
    category: "Formação",
    format: "PPTX",
    size: "12.5 MB",
    restricted: false,
  },
  {
    id: 4,
    title: "Plano de Estudos - Formação Contínua",
    category: "Curricular",
    format: "PDF",
    size: "2.1 MB",
    restricted: false,
  }
];

export function DocumentRepository() {
  return (
    <section id="documentacao" className="py-24 px-12 md:px-24 bg-neutral-100">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none mb-6">
            Documentação Pedagógica
          </h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-2 bg-black"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-black shadow-none p-1"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="py-6 px-4 uppercase font-black text-xs tracking-widest">Documento</th>
                  <th className="py-6 px-4 uppercase font-black text-xs tracking-widest hidden md:table-cell">Categoria</th>
                  <th className="py-6 px-4 uppercase font-black text-xs tracking-widest hidden sm:table-cell">Formato</th>
                  <th className="py-6 px-4 text-right uppercase font-black text-xs tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {DOCUMENTS.map((doc, index) => (
                  <motion.tr 
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-neutral-50 transition-colors group"
                  >
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-4">
                        <FileText className="text-black/40 group-hover:text-black transition-colors" size={20} />
                        <div>
                          <p className="font-bold uppercase tracking-tight">{doc.title}</p>
                          <p className="text-xs text-neutral-400 md:hidden">{doc.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 hidden md:table-cell">
                      <span className="text-neutral-500">{doc.category}</span>
                    </td>
                    <td className="py-6 px-4 hidden sm:table-cell">
                      <span className="font-headline font-bold text-xs">{doc.format} • {doc.size}</span>
                    </td>
                    <td className="py-6 px-4 text-right">
                      {doc.restricted ? (
                        <Button variant="ghost" size="sm" className="opacity-40 cursor-not-allowed gap-2">
                          <Lock size={14} />
                          <span className="text-[10px] uppercase font-black">Restrito</span>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="hover:bg-black hover:text-white rounded-none gap-2">
                          <Download size={14} />
                          <span className="text-[10px] uppercase font-black">Download</span>
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
