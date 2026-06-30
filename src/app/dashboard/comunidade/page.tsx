"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Search, Loader2, Heart, MessageCircle, X, Globe, Sparkles, Share2, Send
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

  // Comentários
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Gostos
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch("/api/db/comunidade_posts?orderBy=created_at&ascending=false&select=*,profiles(first_name,last_name)");
    const { data } = await res.json();
    setPosts(data ?? []);
    setLoading(false);
  }

  async function fetchLikes(postIds: string[]) {
    if (!user?.id || postIds.length === 0) return;
    const [myRes, allRes] = await Promise.all([
      fetch(`/api/db/comunidade_gostos?eq.user_id=${user.id}`),
      fetch(`/api/db/comunidade_gostos`),
    ]);
    const { data: myData } = await myRes.json();
    const { data: allData } = await allRes.json();
    setMyLikes(new Set((myData ?? []).map((g: any) => g.post_id)));
    const counts: Record<string, number> = {};
    for (const g of (allData ?? [])) counts[g.post_id] = (counts[g.post_id] ?? 0) + 1;
    setLikeCounts(counts);
  }

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { if (posts.length && user) fetchLikes(posts.map(p => p.id)); }, [posts, user]);

  async function fetchComments(postId: string) {
    const res = await fetch(`/api/db/comunidade_comentarios?eq.post_id=${postId}&orderBy=created_at&ascending=true&select=*,profiles(first_name,last_name)`);
    const { data } = await res.json();
    setComments(prev => ({ ...prev, [postId]: data ?? [] }));
  }

  async function toggleLike(postId: string) {
    if (!user?.id || likeLoading === postId) return;
    setLikeLoading(postId);
    const liked = myLikes.has(postId);
    if (liked) {
      await fetch("/api/db/comunidade_gostos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eq: { post_id: postId, user_id: user.id } }),
      });
      setMyLikes(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max((prev[postId] ?? 1) - 1, 0) }));
    } else {
      await fetch("/api/db/comunidade_gostos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, user_id: user.id }),
      });
      setMyLikes(prev => new Set([...prev, postId]));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    }
    setLikeLoading(null);
  }

  async function toggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments(null);
      return;
    }
    setOpenComments(postId);
    setCommentText("");
    if (!comments[postId]) await fetchComments(postId);
  }

  async function handleSubmitComment(postId: string) {
    if (!commentText.trim() || !user) return;
    setCommentSubmitting(true);
    await fetch("/api/db/comunidade_comentarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: user.id, content: commentText.trim() }),
    });
    setCommentText("");
    await fetchComments(postId);
    setCommentSubmitting(false);
  }

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
          <h2 className="text-lg font-semibold c-tx">Comunidade</h2>
          <p className="text-sm c-tx3 mt-0.5">
            {filteredPosts.length} publicaç{filteredPosts.length !== 1 ? "ões" : "ão"}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar tópico..." className="pl-9 pr-4 py-2 rounded-lg c-s1 border c-br text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 w-full sm:w-48 transition-colors" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0">
            <Plus size={14} /> <span className="hidden sm:inline">Nova publicação</span><span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? "bg-blue-600 text-white border border-blue-500" : "bg-black/30 text-white/70 border border-white/15 hover:bg-black/50 hover:text-white backdrop-blur-sm"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => {
            const displayName = `${post.profiles?.first_name || ""} ${post.profiles?.last_name || ""}`.trim() || "Agente";
            const isOpen = openComments === post.id;
            const postComments = comments[post.id] ?? [];
            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.04 }}
                className="c-bg2 border c-br rounded-xl p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                      {displayName[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold c-tx truncate">{displayName}</p>
                      <p className="text-[10px] c-tx4">{new Date(post.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${
                    post.category === "Avisos" ? "bg-red-500/10 text-red-400" :
                    post.category === "Casos de Sucesso" ? "bg-emerald-500/10 text-emerald-400" :
                    "bg-blue-500/10 text-blue-400"
                  }`}>{post.category}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold c-tx mb-1.5 leading-snug">{post.title}</h3>
                  <p className="text-xs c-tx3 leading-relaxed line-clamp-3">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t c-br">
                  <button
                    onClick={() => toggleLike(post.id)}
                    disabled={likeLoading === post.id}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${myLikes.has(post.id) ? "text-red-400" : "c-tx5 hover:text-red-400"}`}
                  >
                    <Heart size={12} fill={myLikes.has(post.id) ? "currentColor" : "none"} />
                    Gosto {(likeCounts[post.id] ?? 0) > 0 && `(${likeCounts[post.id]})`}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${isOpen ? "text-blue-400" : "c-tx5 hover:text-blue-400"}`}
                  >
                    <MessageCircle size={12} />
                    Comentar {postComments.length > 0 && `(${postComments.length})`}
                  </button>
                </div>

                {/* Secção de comentários */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 border-t c-br space-y-3">
                        {postComments.length === 0 ? (
                          <p className="text-xs c-tx5 text-center py-2">Sem comentários ainda.</p>
                        ) : (
                          postComments.map((c) => {
                            const cName = `${c.profiles?.first_name || ""} ${c.profiles?.last_name || ""}`.trim() || "Agente";
                            return (
                              <div key={c.id} className="flex gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0 mt-0.5">
                                  {cName[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 c-s1 rounded-lg px-3 py-2">
                                  <p className="text-[10px] font-semibold c-tx2 mb-0.5">{cName}</p>
                                  <p className="text-xs c-tx3">{c.content}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        {/* Input novo comentário */}
                        <div className="flex gap-2 pt-1">
                          <input
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(post.id); } }}
                            placeholder="Escreva um comentário..."
                            className="flex-1 c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40"
                          />
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!commentText.trim() || commentSubmitting}
                            className="px-3 py-2 rounded-lg bg-blue-600 c-tx hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0"
                          >
                            {commentSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredPosts.length === 0 && (
        <div className="py-20 text-center">
          <Globe className="mx-auto c-tx5 mb-4" size={32} strokeWidth={1} />
          <p className="text-sm c-tx5">Sem publicações.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg c-bg border c-br rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b c-br">
              <h3 className="text-base font-semibold c-tx flex items-center gap-2"><Sparkles size={16} className="text-blue-400" /> Nova publicação</h3>
              <button onClick={() => setIsModalOpen(false)} className="c-tx4 hc-tx"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePost} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Título</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Táctica para aulas práticas..." className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none">
                  {["Metodologia","Dúvidas","Casos de Sucesso","Avisos"].map(c => <option key={c} className="c-bg">{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Conteúdo</label>
                <textarea required rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Partilhe o seu conhecimento..." className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg border c-br text-sm c-tx3">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
