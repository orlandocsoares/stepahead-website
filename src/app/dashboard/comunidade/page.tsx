"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Plus, Search, Loader2, 
  Heart, Share2, MessageCircle, X, Globe, User, Sparkles
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function ComunidadePage() {
  const { profile, loading: profileLoading } = useProfile();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  // Formulário
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Metodologia");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const categories = ["Todos", "Metodologia", "Dúvidas", "Casos de Sucesso", "Avisos"];

  useEffect(() => {
    fetchPosts();
    const channel = supabase.channel('posts-live').on('postgres_changes', { event: '*', schema: 'public', table: 'comunidade_posts' }, () => fetchPosts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('comunidade_posts')
      .select('*, profiles(first_name, last_name, role, avatar_url)')
      .order('created_at', { ascending: false });
    
    if (!error && data) setPosts(data);
    setLoading(false);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !profile) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('comunidade_posts').insert([{
      user_id: profile.id,
      title,
      content,
      category
    }]);

    if (!error) {
      setIsModalOpen(false);
      setTitle("");
      setContent("");
      fetchPosts();
    }
    setIsSubmitting(false);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, activeCategory]);

  if (profileLoading || loading) return (
    <div className="h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col max-w-[1400px] mx-auto pt-24 pb-10 px-4 md:px-10 md:pl-48 relative z-10 selection:bg-teal-500/30 overflow-hidden">
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-native-scroll::-webkit-scrollbar { width: 2px; }
        .hide-native-scroll::-webkit-scrollbar-track { background: transparent; }
        .hide-native-scroll::-webkit-scrollbar-thumb { background: transparent; }
      `}} />

      {/* HEADER DE COMUNIDADE */}
      <header className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 shrink-0">
        <div className="space-y-4 text-left">
          <p className="text-[9px] tracking-[1em] text-blue-500 uppercase font-black italic">Intelligence Network</p>
          <h1 className="text-6xl font-extralight text-white uppercase tracking-tighter italic leading-none">
            Rede de <span className="opacity-40 not-italic font-bold">Partilha</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
          <div className="relative w-full sm:max-w-xs group">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="PESQUISAR TÓPICOS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-4 text-[10px] text-white uppercase tracking-widest outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-[10px] uppercase font-black tracking-widest rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500 border-0 shrink-0"
          >
            <Plus size={16} /> Nova Publicação
          </motion.button>
        </div>
      </header>

      {/* FILTROS DE CATEGORIA */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide shrink-0">
        {categories.map((cat) => (
          <button 
            key={cat} onClick={() => setActiveCategory(cat)} 
            className={`px-8 py-3 rounded-full text-[8px] uppercase tracking-[0.3em] font-black transition-all border whitespace-nowrap shrink-0 ${activeCategory === cat ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" : "bg-white/[0.02] text-white/30 border-white/5 hover:border-white/20 hover:text-white"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 relative flex gap-8 min-h-0">
        <div className="flex-1 overflow-y-auto hide-native-scroll pb-10 pr-2" onScroll={handleScroll}>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, index) => {
                const displayName = `${post.profiles?.first_name || ""} ${post.profiles?.last_name || ""}`.trim() || "Agente";
                const displayAvatar = post.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=ffffff&textColor=000000`;
                
                return (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl group hover:border-blue-500/30 hover:bg-black/40 transition-all duration-700 shadow-xl flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-white/10 shrink-0">
                            <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover opacity-80" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-bold text-sm uppercase tracking-widest">{displayName}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono mt-1">{post.profiles?.role} // {new Date(post.created_at).toLocaleDateString('pt-PT')}</p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black tracking-widest border ${
                          post.category === 'Avisos' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          post.category === 'Casos de Sucesso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {post.category}
                        </div>
                      </div>
                      
                      <div className="text-left space-y-4 mb-8">
                        <h3 className="text-2xl font-light text-white uppercase tracking-tighter italic leading-none group-hover:text-blue-400 transition-colors">{post.title}</h3>
                        <p className="text-xs text-white/50 leading-relaxed font-light">{post.content}</p>
                      </div>
                    </div>

                    {/* Barra de Interacção (Preparada para expansão futura) */}
                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                      <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-blue-400 transition-colors"><Heart size={14}/> Gosto</button>
                      <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-blue-400 transition-colors"><MessageCircle size={14}/> Comentar</button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredPosts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center border border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
              <Globe className="mx-auto text-white/5 mb-6" size={48} strokeWidth={1} />
              <p className="text-[10px] uppercase tracking-[0.8em] text-white/20 font-black italic">A Rede de Inteligência aguarda contributos.</p>
            </motion.div>
          )}
        </div>

        {/* CALHA DE SCROLL NÉON INTEGRADA (O COMETA) */}
        <div className="w-[3px] rounded-full bg-white/[0.02] relative overflow-hidden shrink-0 hidden md:block mb-10">
          <motion.div
            key={scrollDirection}
            animate={scrollDirection === 'down' ? { top: ['-20%', '120%'] } : { top: ['120%', '-20%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className={`absolute left-0 w-full h-[15%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] ${scrollDirection === 'down' ? 'bg-gradient-to-b from-transparent via-blue-500/80 to-white' : 'bg-gradient-to-t from-transparent via-blue-500/80 to-white'}`}
          />
        </div>
      </div>

      {/* MODAL DE NOVA PUBLICAÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-zinc-950/90 border border-white/10 p-12 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors bg-transparent border-0 outline-none"><X size={20}/></button>
              
              <h2 className="text-3xl font-light text-white uppercase tracking-tighter italic mb-8 flex items-center gap-4"><Sparkles className="text-blue-500"/> Nova Partilha</h2>
              
              <form onSubmit={handleCreatePost} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Título do Tópico</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all" placeholder="EX: TÁCTICA PARA AULAS PRÁTICAS..." />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border-0 border-b border-white/10 py-4 px-4 text-[10px] uppercase tracking-widest text-white outline-none border-0">
                    <option className="bg-zinc-900">Metodologia</option>
                    <option className="bg-zinc-900">Dúvidas</option>
                    <option className="bg-zinc-900">Casos de Sucesso</option>
                    <option className="bg-zinc-900">Avisos</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/30 ml-2">Conteúdo</label>
                  <textarea required rows={5} value={content} onChange={e => setContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white outline-none focus:border-blue-500 transition-all resize-none" placeholder="PARTILHE O SEU CONHECIMENTO..." />
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-500 transition-all shadow-2xl flex justify-center items-center gap-3 border-0 mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Share2 size={16}/> Publicar na Rede</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}