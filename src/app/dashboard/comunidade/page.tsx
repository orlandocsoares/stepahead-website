"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Search, Loader2, Heart, MessageCircle, X, Globe, Sparkles, Share2
} from "lucide-react";

const CATEGORIES = ["Todos", "Metodologia", "Dúvidas", "Casos de Sucesso", "Avisos"];

export default function ComunidadePage() {
  const { user } = useAdminUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Metodologia");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch("/api/db/comunidade_posts?orderBy=created_at&ascending=false");
    const { data } = await res.json();
    setPosts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchPosts(); }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;
    setIsSubmitting(true);
    await fetch("/api/db/comunidade_posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, title, content, category }),
    });
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    fetchPosts();
    setIsSubmitting(false);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [posts, searchTerm, activeCategory]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-blue-400/60 italic mb-1 font-medium">
            Intelligence Network
          </p>
          <h2 className="text-4xl font-extralight italic uppercase tracking-tight text-white leading-none">
            Rede <span className="font-bold text-white/30">de Partilha</span>
          </h2>
          <p className="text-xs text-white/25 mt-2">
            {filteredPosts.length} publicaç{filteredPosts.length !== 1 ? "ões" : "ão"}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar tópico..." className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 w-full sm:w-48 transition-colors" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0">
            <Plus size={14} /> <span className="hidden sm:inline">Nova publicação</span><span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => {
            const displayName = `${post.profiles?.first_name || ""} ${post.profiles?.last_name || ""}`.trim() || "Agente";
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.04 }}
                className="bg-[#13131f] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                      {displayName[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-white/30">{new Date(post.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                    post.category === "Avisos" ? "bg-red-500/10 text-red-400" :
                    post.category === "Casos de Sucesso" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>{post.category}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">{post.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                  <button className="flex items-center gap-1.5 text-xs text-white/20 hover:text-blue-400 transition-colors"><Heart size={12} /> Gosto</button>
                  <button className="flex items-center gap-1.5 text-xs text-white/20 hover:text-blue-400 transition-colors"><MessageCircle size={12} /> Comentar</button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPosts.length === 0 && (
        <div className="py-20 text-center">
          <Globe className="mx-auto text-white/10 mb-4" size={32} strokeWidth={1} />
          <p className="text-sm text-white/20">Sem publicações.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0d0d14] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-semibold text-white flex items-center gap-2"><Sparkles size={16} className="text-blue-400" /> Nova publicação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePost} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Título</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Táctica para aulas práticas..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white outline-none">
                  {["Metodologia","Dúvidas","Casos de Sucesso","Avisos"].map(c => <option key={c} className="bg-[#0d0d14]">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Conteúdo</label>
                <textarea required rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Partilhe o seu conhecimento..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/[0.06] text-sm text-white/50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Share2 size={13} /> Publicar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
