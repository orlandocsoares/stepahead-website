"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Search, Plus, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DocumentRepository() {
  const { profile } = useProfile();
  const isFormador = profile?.role === 'formador';

  const [docs, setDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados do formulário de upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Manuais");

  // 1. CARREGAR DOCUMENTOS DA BASE DE DADOS
  const fetchDocs = async () => {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data);
  };

  useEffect(() => { fetchDocs(); }, []);

  // 2. FUNÇÃO DE UPLOAD (SÓ PARA FORMADORES)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    try {
      // a) Upload para o Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // b) Pegar a URL pública
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);

      // c) Guardar metadados na tabela SQL
      const { error: dbError } = await supabase.from('documents').insert({
        title,
        category,
        file_url: publicUrl,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: fileExt?.toUpperCase()
      });

      if (dbError) throw dbError;

      setIsModalOpen(false);
      setTitle(""); setFile(null);
      fetchDocs(); // Atualiza a lista
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar ficheiro.");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. FUNÇÃO DE ELIMINAR
  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Deseja eliminar este documento?")) return;
    
    // Extrair nome do ficheiro da URL para apagar do storage também
    const fileName = url.split('/').pop();
    await supabase.storage.from('documents').remove([fileName!]);
    await supabase.from('documents').delete().eq('id', id);
    fetchDocs();
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.2em] text-white mb-2">Repositório</h1>
          <p className="text-xs text-white/40 font-light tracking-widest uppercase">Material de Apoio Oficial</p>
        </div>

        <div className="flex items-center gap-4">
           {isFormador && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-white text-black px-5 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
            >
              <Plus size={14} /> Adicionar
            </button>
           )}
        </div>
      </div>

      {/* LISTA DE DOCUMENTOS (GLASSMORPHISM) */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="divide-y divide-white/5">
          {docs.length === 0 && <div className="p-20 text-center text-white/20 uppercase tracking-widest text-xs font-light">Nenhum documento disponível</div>}
          
          {docs.map((doc, index) => (
            <motion.div 
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="col-span-1 md:col-span-7 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                  <FileText size={18} strokeWidth={1} />
                </div>
                <div>
                  <h4 className="text-sm font-light text-white/80 group-hover:text-white transition-colors">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/30">
                    <span className="bg-white/5 px-2 py-0.5 rounded">{doc.category}</span>
                    <span>{doc.type} • {doc.size}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-5 flex justify-end gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={doc.file_url} 
                  target="_blank"
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-black hover:bg-white transition-all"
                >
                  <Download size={14} />
                </a>
                {isFormador && (
                  <button 
                    onClick={() => handleDelete(doc.id, doc.file_url)}
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-red-500/40 hover:text-white hover:bg-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MODAL DE UPLOAD (EXCLUSIVO FORMADOR) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black/95 border border-white/10 text-white backdrop-blur-2xl p-8 rounded-none">
          <DialogHeader><DialogTitle className="text-lg font-light uppercase tracking-[0.2em]">Novo Documento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpload} className="space-y-6 mt-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-white/40">Título do Ficheiro</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent border-0 border-b border-white/20 py-2 text-sm focus:ring-0 focus:border-white outline-none" placeholder="Ex: Manual de Matemática III" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-white/40">Ficheiro (PDF, DOCX...)</label>
              <input type="file" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-white/40 file:bg-white/10 file:border-0 file:text-white file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-white/20" />
            </div>
            <button 
              disabled={isUploading}
              className="w-full bg-white text-black py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all flex justify-center items-center gap-2"
            >
              {isUploading ? <><Loader2 className="animate-spin" size={14} /> A enviar...</> : "Concluir Upload"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}