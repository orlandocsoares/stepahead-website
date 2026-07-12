"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Video, Search, Download,
  Loader2, Sparkles, Plus, BookOpen, Shield, HelpCircle,
  Globe, Lock, Mail, GraduationCap, UserCheck, EyeOff, Check, User, Trash2
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function RepositorioPage() {
  const { profile } = useProfile();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Geral");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estados do formulário de upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Geral");
  
  // Novos estados para o controlo de partilha e filtros
  const [docStatus, setDocStatus] = useState("publicado");
  const [visibilidade, setVisibilidade] = useState("publico");
  const [destinatarioEmail, setDestinatarioEmail] = useState("");
  const [activeShareFilter, setActiveShareFilter] = useState("todos"); // 'todos', 'meus', 'partilhados'

  // REFINAMENTO UNIFORME: Rastreador de Direcção para a Calha de Néon (O Cometa)
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current) {
      setScrollDirection('down');
    } else if (currentScrollY < lastScrollY.current) {
      setScrollDirection('up');
    }
    lastScrollY.current = currentScrollY;
  };

  const categories = ["Geral", "Matemática", "Língua Portuguesa", "Física", "Química", "Pedagogia"];
  const isAuthorized = profile?.role === 'formador' || profile?.role === 'super-admin';

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      setLoading(true);
      const res = await fetch("/api/db/arquivos?select=*,profiles(*)&orderBy=created_at&ascending=false");
      const json = await res.json();
      if (json.data) setFiles(json.data);
    } catch (err) {
      console.error("Erro ao carregar repositório:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Eliminar "${fileName}"? Esta acção não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/db/arquivos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eq: { id: fileId } }),
      });
      if (!res.ok) throw new Error("Erro ao eliminar");
      fetchFiles();
    } catch (err) {
      alert("Erro ao eliminar o ficheiro.");
    }
  };

  const handlePublish = async (fileId: string) => {
    try {
      const res = await fetch("/api/db/arquivos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: { visibilidade: 'publico' }, eq: { id: fileId } }),
      });
      if (!res.ok) throw new Error("Erro ao publicar");
      fetchFiles();
    } catch (err) {
      console.error("Erro ao publicar:", err);
      alert("Erro ao publicar o rascunho.");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !title) return;

    setIsUploading(true);
    try {
      // Encode URI Component para garantir que ficheiros com espaços não quebram a URL
      const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}`;
      
      const fd = new FormData();
      fd.append("bucket", "materiais");
      fd.append("path", fileName);
      fd.append("file", uploadFile);
      const upRes = await fetch("/api/storage/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();
      if (!upRes.ok || upJson.error) throw new Error(upJson.error?.message ?? "Erro no upload.");

      const dbRes = await fetch("/api/db/arquivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: title,
          nome_arquivo: fileName,
          area: category,
          tamanho: (uploadFile.size / (1024 * 1024)).toFixed(2) + " MB",
          tipo: uploadFile.type.includes("video") ? "video" : "pdf",
          visibilidade: visibilidade,
          destinatario_email: visibilidade === "especifico" ? destinatarioEmail : null,
        }),
      });
      const dbJson = await dbRes.json();
      if (!dbRes.ok || dbJson.error) throw new Error(dbJson.error?.message ?? "Erro ao guardar.");

      setIsModalOpen(false);
      resetForm();
      fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Erro na operação de upload. Verifique as permissões de armazenamento.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setUploadFile(null);
    setDocStatus("publicado");
    setVisibilidade("publico");
    setDestinatarioEmail("");
  };

  const getVisibilidadeHelperText = () => {
    const userSpecialty = profile?.specialization || profile?.especialidade || "sua disciplina";
    switch (visibilidade) {
      case "publico":
        return "Qualquer utilizador autenticado (alunos, professores e administradores) poderá aceder a este ficheiro.";
      case "area_todos":
        return `Apenas alunos e professores da especialidade de ${userSpecialty} terão acesso a este ficheiro.`;
      case "area_alunos":
        return `Apenas alunos da especialidade de ${userSpecialty} terão acesso. Professores e outros alunos não o verão.`;
      case "area_professores":
        return `Apenas professores (formadores) da especialidade de ${userSpecialty} terão acesso. Oculto para alunos.`;
      case "professores":
        return "Todos os professores (formadores) da plataforma poderão ver. Oculto para todos os alunos.";
      case "especifico":
        return "Apenas você e o utilizador com o e-mail indicado abaixo poderão visualizar este ficheiro.";
      case "privado":
        return "Apenas você (autor do upload) terá acesso a este ficheiro.";
      default:
        return "";
    }
  };

  const getBadgeStyles = (vis: string) => {
    switch (vis) {
      case "publico":
        return { label: "Público", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Globe size={10} className="shrink-0" /> };
      case "area_todos":
        return { label: "Minha Área", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: <BookOpen size={10} className="shrink-0" /> };
      case "area_professores":
        return { label: "Minha Área (Professores)", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: <UserCheck size={10} className="shrink-0" /> };
      case "area_alunos":
        return { label: "Minha Área (Alunos)", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: <GraduationCap size={10} className="shrink-0" /> };
      case "professores":
        return { label: "Todos os Professores", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: <Shield size={10} className="shrink-0" /> };
      case "especifico":
        return { label: "Partilhado", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <Mail size={10} className="shrink-0" /> };
      case "privado":
        return { label: "Privado", color: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: <Lock size={10} className="shrink-0" /> };
      default:
        return { label: "Público", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <Globe size={10} className="shrink-0" /> };
    }
  };

  const filtered = useMemo(() => {
    return files.filter(f => {
      const matchesCat = activeCategory === "Geral" || f.area === activeCategory;
      const matchesSearch = f.label?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesShare = true;
      if (activeShareFilter === "meus") {
        matchesShare = f.uploader_id === profile?.id;
      } else if (activeShareFilter === "partilhados") {
        matchesShare = f.uploader_id !== profile?.id && (
          f.destinatario_email?.toLowerCase() === profile?.email?.toLowerCase() ||
          f.visibilidade === "area_todos" ||
          f.visibilidade === "area_alunos" ||
          f.visibilidade === "area_professores" ||
          f.visibilidade === "professores"
        );
      }
      
      return matchesCat && matchesSearch && matchesShare;
    });
  }, [files, activeCategory, searchQuery, activeShareFilter, profile]);

  if (loading && files.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-transparent">
      <Loader2 size={32} className="text-blue-500 animate-spin mb-6" strokeWidth={1} />
      <p className="text-[9px] uppercase tracking-[1em] text-white/20 animate-pulse font-sans">Indexando Materiais...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-[1440px] mx-auto pt-24 pb-10 px-4 md:px-10 md:pl-48 relative z-10 selection:bg-blue-500/30 overflow-hidden font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-native-scroll::-webkit-scrollbar { width: 2px; }
        .hide-native-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-native-scroll::-webkit-scrollbar-thumb { background: transparent; }
      `}} />

      {/* HEADER DINÂMICO FIXO */}
      <header id="tour-repo-header" className="mb-10 space-y-8 shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4 text-left">
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] tracking-[0.8em] text-blue-500 uppercase font-black italic"
            >
              Knowledge Base // 2026
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none"
            >
              Repositório <span className="opacity-20 not-italic">Digital</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-6 w-full lg:w-auto justify-end">
            <div className="relative flex-1 lg:w-80 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-all" size={18} />
              <input 
                placeholder="PESQUISAR NO TERMINAL..." 
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-[10px] text-white uppercase tracking-widest outline-none focus:border-blue-500/30 transition-all backdrop-blur-3xl"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isAuthorized && (
              <button
                id="tour-repo-novo-item"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-4 px-8 py-5 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 border-0 shrink-0"
              >
                <Plus size={16} /> Novo Item
              </button>
            )}
          </div>
        </div>

        <div id="tour-category-tabs" className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide pt-2">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-10 py-4 rounded-full text-[9px] uppercase tracking-[0.3em] font-black transition-all border whitespace-nowrap shrink-0 ${
                activeCategory === cat 
                  ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
                  : "bg-white/[0.02] text-white/30 border-white/5 hover:border-white/20 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FILTROS OPERACIONAIS DE VISIBILIDADE */}
        <div id="tour-share-filters" className="flex flex-wrap gap-3 border-t border-white/5 pt-6 pb-2">
          <button
            onClick={() => setActiveShareFilter("todos")}
            className={`px-6 py-3 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all border whitespace-nowrap ${
              activeShareFilter === "todos" 
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
                : "bg-white/[0.02] text-white/40 border-white/5 hover:border-white/20 hover:text-white"
            }`}
          >
            Todos os Recursos
          </button>
          <button 
            onClick={() => setActiveShareFilter("meus")} 
            className={`px-6 py-3 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all border whitespace-nowrap ${
              activeShareFilter === "meus" 
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
                : "bg-white/[0.02] text-white/40 border-white/5 hover:border-white/20 hover:text-white"
            }`}
          >
            Os Meus Recursos
          </button>
          <button 
            onClick={() => setActiveShareFilter("partilhados")} 
            className={`px-6 py-3 rounded-xl text-[9px] uppercase tracking-wider font-black transition-all border whitespace-nowrap ${
              activeShareFilter === "partilhados" 
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" 
                : "bg-white/[0.02] text-white/40 border-white/5 hover:border-white/20 hover:text-white"
            }`}
          >
            Partilhados Comigo
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex gap-8 min-h-0">
        
        <div className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2" onScroll={handleScroll}>
          
          {/* PAINEL DE DIRETRIZES DIDÁCTICAS */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 sm:p-10 rounded-[3rem] bg-gradient-to-br from-blue-950/15 via-black/40 to-transparent border border-white/5 backdrop-blur-3xl text-left space-y-6 mb-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <BookOpen className="text-blue-500" size={20} />
              <div>
                <h2 className="text-lg font-light tracking-widest text-white uppercase italic">Base de Conhecimento Centralizada</h2>
                <p className="text-[7.5px] text-white/30 uppercase tracking-[0.3em] font-mono mt-1">Saber Mais Angola // Directriz Pedagógica</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-blue-400">
                  <Shield size={14} />
                  <h4 className="text-[10px] font-black uppercase tracking-wider">O que é?</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-white/40 uppercase tracking-widest">
                  É a biblioteca digital oficial de apoio metodológico ao III Ciclo em Angola, promovida de forma bilateral.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Sparkles size={14} />
                  <h4 className="text-[10px] font-black uppercase tracking-wider">O que faz?</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-white/40 uppercase tracking-widest">
                  Disponibiliza manuais de formação, guiões de supervisão e recursos multimédia em formato PDF e Vídeo.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-amber-400">
                  <HelpCircle size={14} />
                  <h4 className="text-[10px] font-black uppercase tracking-wider">Vantagens</h4>
                </div>
                <p className="text-[10px] leading-relaxed text-white/40 uppercase tracking-widest">
                  Garante o alinhamento metodológico nacional das províncias e apoia a auto-formação continuada dos agentes.
                </p>
              </div>
            </div>
          </motion.section>

          {/* GRELHA DE MATERIAIS - CARTÕES INTELIGENTES */}
          <div id="tour-materials-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((file, index) => {
                const fileName = file.nome_arquivo || "";
                const encodedFileName = encodeURIComponent(fileName);
                const fileUrl = fileName ? `/storage/v1/object/public/materiais/${encodedFileName}` : "#";
                
                const parts = fileName.split(".");
                const extension = parts.length > 1 ? parts.pop().toUpperCase() : "DOC";
                const isImage = ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(extension);

                const badge = getBadgeStyles(file.visibilidade);

                return (
                  <motion.div 
                    key={file.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="p-8 rounded-[3.5rem] bg-white/[0.01] border border-white/5 hover:border-blue-500/30 backdrop-blur-3xl transition-all duration-700 group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-all z-0" />

                    <div className="relative z-10 text-left">
                      <div className="flex justify-between items-start mb-8 gap-4">
                        
                        {/* Capa Automática no Ícone Original */}
                        <div className={`w-20 h-20 rounded-[1.5rem] overflow-hidden border border-white/5 transition-all duration-500 group-hover:scale-105 group-hover:border-blue-500/30 flex items-center justify-center bg-white/5 ${file.tipo === 'video' ? 'shadow-[0_0_20px_rgba(249,115,22,0.1)] text-orange-500' : 'shadow-[0_0_20px_rgba(59,130,246,0.1)] text-blue-500'}`}>
                          {isImage && fileName ? (
                            <img src={fileUrl} alt={file.label} className="w-full h-full object-cover" />
                          ) : (
                            file.tipo === 'video' ? <Video size={28} strokeWidth={1.5} /> : <FileText size={28} strokeWidth={1.5} />
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 min-w-0">
                          <span className="text-[8px] uppercase tracking-[0.4em] text-blue-500 font-black italic block truncate max-w-full">
                            {file.area}
                          </span>
                          
                          {/* Badge de Visibilidade */}
                          <span className={`px-2.5 py-1 rounded-full text-[7px] uppercase tracking-wider font-bold border flex items-center gap-1 leading-none ${badge.color}`}>
                            {badge.icon}
                            {badge.label}
                          </span>

                          {file.status === 'rascunho' && (
                            <span className="px-2.5 py-1 rounded-full text-[7px] uppercase tracking-wider font-bold bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1 leading-none">
                              <EyeOff size={10} /> Rascunho
                            </span>
                          )}

                          <span className="text-[7px] uppercase tracking-widest text-white/10 block font-mono">
                            REF: {file.id.slice(0, 8)}
                          </span>
                          <span className="text-[7px] uppercase tracking-widest text-white/40 block font-mono">
                            {extension}
                          </span>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="text-2xl font-light text-white uppercase tracking-tighter leading-tight group-hover:text-blue-200 transition-colors mb-4 italic line-clamp-2">
                          {file.label}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-[1px] w-8 bg-blue-500/30" />
                          <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-medium truncate">
                            {file.tamanho} • {file.tipo === 'video' ? 'Media File' : 'Documento Técnico'}
                          </span>
                        </div>
                      </div>

                      {/* Informações do Uploader */}
                      {file.profiles ? (
                        <div className="flex items-center gap-2 mb-8 bg-white/[0.02] border border-white/5 py-2.5 px-4 rounded-xl">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                            {file.profiles.avatar_url ? (
                              <img src={file.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={10} className="text-white/40" />
                            )}
                          </div>
                          <span className="text-[8px] uppercase tracking-widest text-white/50 truncate">
                            Prof: {file.profiles.first_name} {file.profiles.last_name || ""}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-8 bg-white/[0.02] border border-white/5 py-2.5 px-4 rounded-xl">
                          <User size={10} className="text-white/20 shrink-0" />
                          <span className="text-[8px] uppercase tracking-widest text-white/30 truncate">
                            Coordenação Saber Mais
                          </span>
                        </div>
                      )}

                      {/* Delete Button — dono ou admin */}
                      {(file.uploader_id === profile?.id || profile?.role === 'admin' || profile?.role === 'super-admin') && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await handleDelete(file.id, file.label || file.titulo || "ficheiro");
                          }}
                          className="mb-2 w-full py-2.5 bg-red-600/5 hover:bg-red-600/20 text-red-500/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={11} /> Eliminar
                        </button>
                      )}

                      {/* Fast Publish Button */}
                      {file.status === 'rascunho' && (file.uploader_id === profile?.id || profile?.role === 'super-admin') && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await handlePublish(file.id);
                          }}
                          className="mb-8 w-full py-3.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Check size={12} /> Publicar Rascunho
                        </button>
                      )}
                    </div>

                    <a 
                      href={fileUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="relative z-10 flex items-center justify-between w-full p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white hover:text-black transition-all duration-500 group/btn mt-auto"
                    >
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">Aceder ao Conteúdo</span>
                      <div className="flex items-center gap-2">
                        <Download size={16} className="group-hover/btn:translate-y-1 transition-transform" />
                      </div>
                    </a>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-40 text-center border border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]"
            >
              <Sparkles className="mx-auto text-white/5 mb-6" size={48} strokeWidth={1} />
              <p className="text-[10px] uppercase tracking-[0.8em] text-white/20 font-black italic">
                Nenhum material indexado em {activeCategory}
              </p>
            </motion.div>
          )}

          <div className="mt-20 opacity-20 text-center">
             <p className="text-[7px] uppercase tracking-[2em] font-black italic drop-shadow-md">End of Archive Record</p>
          </div>
        </div>

        {/* CALHA DE SCROLL NÉON INTEGRADA (O COMETA) */}
        <div className="w-[3px] rounded-full bg-white/[0.02] relative overflow-hidden shrink-0 hidden md:block mb-10">
          <motion.div
            key={scrollDirection}
            animate={
              scrollDirection === 'down' 
                ? { top: ['-20%', '120%'] } 
                : { top: ['120%', '-20%'] }
            }
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className={`absolute left-0 w-full h-[15%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${
              scrollDirection === 'down'
                ? 'bg-gradient-to-b from-transparent via-blue-500/80 to-white'
                : 'bg-gradient-to-t from-transparent via-blue-500/80 to-white'
            }`}
          />
        </div>

      </div>

      {/* MODAL DE UPLOAD */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="bg-black/95 border border-white/10 text-white backdrop-blur-3xl p-10 rounded-none max-w-lg overflow-y-auto max-h-[90vh] scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-xl font-light uppercase tracking-[0.3em] flex items-center gap-4">
              <Plus className="text-blue-500" /> Registar Novo Recurso
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpload} className="space-y-6 mt-8 text-left">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Título do Material</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-sm focus:ring-0 focus:border-blue-500 outline-none transition-all" placeholder="EX: GUIA PEDAGÓGICO III" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Área de Intervenção</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-[10px] uppercase tracking-widest outline-none">
                {categories.map(cat => <option key={cat} value={cat} className="bg-black">{cat}</option>)}
              </select>
            </div>

            {/* Novo: Estado (Draft vs Publicado) */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Estado de Publicação</label>
              <select value={docStatus} onChange={e => setDocStatus(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-[10px] uppercase tracking-widest outline-none">
                <option value="publicado" className="bg-black">Publicar Imediatamente</option>
                <option value="rascunho" className="bg-black">Guardar como Rascunho</option>
              </select>
            </div>

            {/* Novo: Visibilidade Combobox */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Visibilidade do Documento</label>
              <select value={visibilidade} onChange={e => setVisibilidade(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-[10px] uppercase tracking-widest outline-none">
                <option value="publico" className="bg-black">Público (Todos os utilizadores)</option>
                <option value="area_todos" className="bg-black">Alunos e Professores da minha Área</option>
                <option value="area_alunos" className="bg-black">Apenas Alunos da minha Área</option>
                <option value="area_professores" className="bg-black">Apenas Professores da minha Área</option>
                <option value="professores" className="bg-black">Todos os Professores (Qualquer área)</option>
                <option value="especifico" className="bg-black">Partilhar por E-mail (Utilizador específico)</option>
                <option value="privado" className="bg-black">Privado (Apenas eu)</option>
              </select>
              
              {/* Helper Text Explicativo */}
              <p className="text-[8.5px] uppercase tracking-wider text-blue-400/70 mt-2 px-2 leading-relaxed">
                {getVisibilidadeHelperText()}
              </p>
            </div>

            {/* Novo: E-mail do Destinatário Condicional */}
            {visibilidade === "especifico" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">E-mail do Destinatário</label>
                <input 
                  type="email" 
                  required 
                  value={destinatarioEmail} 
                  onChange={e => setDestinatarioEmail(e.target.value)} 
                  className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-sm focus:ring-0 focus:border-blue-500 outline-none transition-all" 
                  placeholder="EX: formando@sabermais.edu.ao" 
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Ficheiro Técnico</label>
              <div className="relative border-2 border-dashed border-white/5 p-8 text-center rounded-3xl hover:border-blue-500/30 transition-all">
                <input type="file" required onChange={e => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Download className="mx-auto text-white/10 mb-4" />
                <p className="text-[8px] uppercase tracking-widest text-white/40">{uploadFile ? uploadFile.name : "Arraste ou clique para seleccionar"}</p>
              </div>
            </div>

            <button 
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-6 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all flex justify-center items-center gap-4 shadow-2xl border-0"
             >
              {isUploading ? <><Loader2 className="animate-spin" size={16} /> A Processar...</> : "Finalizar Registo"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
