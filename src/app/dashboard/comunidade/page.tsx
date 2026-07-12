"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Loader2, Heart, MessageCircle, X,
  Globe, Sparkles, Share2, Send, Pin, TrendingUp,
  ArrowUpDown, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

const CATEGORIES = ["Todos", "Metodologia", "Dúvidas", "Casos de Sucesso", "Avisos"];

const CAT_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "Metodologia":      { bg: "bg-blue-500/10",    text: "text-blue-400",    dot: "bg-blue-500" },
  "Dúvidas":          { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-500" },
  "Casos de Sucesso": { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  "Avisos":           { bg: "bg-red-500/10",     text: "text-red-400",     dot: "bg-red-500" },
};

const SORT_OPTIONS = [
  { value: "recentes",    label: "Mais recentes" },
  { value: "gostos",      label: "Mais gostos" },
  { value: "comentarios", label: "Mais comentados" },
];

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function ComunidadePage() {
  const { user } = useAdminUser();
  const isAdmin = user?.role === "admin" || user?.role === "super-admin";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("recentes");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Metodologia");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  // Comentários: mapa post_id → lista; expandido: set de post_ids
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<string | null>(null);

  // Post expandido (conteúdo longo)
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set());

  // Gostos
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  // Contagem de comentários
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  async function fetchPosts() {
    setLoading(true);
    const [postsRes, commRes] = await Promise.all([
      fetch("/api/db/comunidade_posts?orderBy=created_at&ascending=false&select=*,profiles(first_name,last_name)"),
      fetch("/api/db/comunidade_comentarios"),
    ]);
    const { data } = await postsRes.json();
    const { data: allComments } = await commRes.json();
    setPosts(data ?? []);
    // Contar comentários por post
    const counts: Record<string, number> = {};
    for (const c of (allComments ?? [])) counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
    setCommentCounts(counts);
    setLoading(false);
  }

  async function fetchLikes() {
    if (!user?.id) return;
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
  useEffect(() => { if (posts.length && user) fetchLikes(); }, [posts, user]);

  async function fetchComments(postId: string) {
    const res = await fetch(`/api/db/comunidade_comentarios?eq.post_id=${postId}&orderBy=created_at&ascending=true&select=*,profiles(first_name,last_name)`);
    const { data } = await res.json();
    setComments(prev => ({ ...prev, [postId]: data ?? [] }));
  }

  function toggleComments(postId: string) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) { next.delete(postId); }
      else {
        next.add(postId);
        if (!comments[postId]) fetchComments(postId);
      }
      return next;
    });
    setCommentTexts(prev => ({ ...prev, [postId]: prev[postId] ?? "" }));
  }

  async function toggleLike(postId: string) {
    if (!user?.id || likeLoading === postId) return;
    setLikeLoading(postId);
    const liked = myLikes.has(postId);
    if (liked) {
      await fetch("/api/db/comunidade_gostos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eq: { post_id: postId, user_id: user.id } }) });
      setMyLikes(prev => { const s = new Set(prev); s.delete(postId); return s; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max((prev[postId] ?? 1) - 1, 0) }));
    } else {
      await fetch("/api/db/comunidade_gostos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ post_id: postId, user_id: user.id }) });
      setMyLikes(prev => new Set([...prev, postId]));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    }
    setLikeLoading(null);
  }

  async function handleSubmitComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text || !user) return;
    setCommentSubmitting(postId);
    await fetch("/api/db/comunidade_comentarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, user_id: user.id, content: text }),
    });
    setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    await fetchComments(postId);
    setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
    setCommentSubmitting(null);
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Eliminar esta publicação?")) return;
    await fetch("/api/db/comunidade_posts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eq: { id: postId } }) });
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  function togglePin(postId: string) {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !user) return;
    setIsSubmitting(true);
    await fetch("/api/db/comunidade_posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, title, content, category }) });
    setIsModalOpen(false);
    setTitle(""); setContent("");
    fetchPosts();
    setIsSubmitting(false);
  };

  // Contagens por categoria
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { "Todos": posts.length };
    for (const p of posts) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [posts]);

  // Top contribuidores
  const topContributors = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    for (const p of posts) {
      const id = p.user_id;
      const name = `${p.profiles?.first_name || ""} ${p.profiles?.last_name || ""}`.trim() || "Agente";
      if (!map[id]) map[id] = { name, count: 0 };
      map[id].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => {
      const matchSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      return matchSearch && matchCat;
    });
    if (sortBy === "gostos") result = [...result].sort((a, b) => (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0));
    else if (sortBy === "comentarios") result = [...result].sort((a, b) => (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0));
    // Pinned first
    result = [...result.filter(p => pinnedIds.has(p.id)), ...result.filter(p => !pinnedIds.has(p.id))];
    return result;
  }, [posts, searchTerm, activeCategory, sortBy, likeCounts, commentCounts, pinnedIds]);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex gap-6 w-full h-full">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col gap-4 w-56 shrink-0">

        {/* Categorias */}
        <div id="tour-comunidade-categorias" className="c-bg2 border c-br rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b c-br">
            <p className="text-[10px] font-bold uppercase tracking-widest c-tx5">Categorias</p>
          </div>
          <div className="p-2 space-y-0.5">
            {CATEGORIES.map(cat => {
              const style = CAT_STYLE[cat];
              const active = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-xs ${active ? "bg-blue-600/20 text-blue-300 font-medium" : "c-tx4 hc-s2 hc-tx"}`}>
                  <div className="flex items-center gap-2">
                    {style && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
                    {cat}
                  </div>
                  <span className={`text-[10px] ${active ? "text-blue-400" : "c-tx5"}`}>{catCounts[cat] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ordenar */}
        <div className="c-bg2 border c-br rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b c-br flex items-center gap-2">
            <ArrowUpDown size={11} className="c-tx5" />
            <p className="text-[10px] font-bold uppercase tracking-widest c-tx5">Ordenar</p>
          </div>
          <div className="p-2 space-y-0.5">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`w-full px-3 py-2 rounded-lg text-left text-xs transition-colors ${sortBy === opt.value ? "bg-blue-600/20 text-blue-300 font-medium" : "c-tx4 hc-s2 hc-tx"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top contribuidores */}
        {topContributors.length > 0 && (
          <div className="c-bg2 border c-br rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b c-br flex items-center gap-2">
              <TrendingUp size={11} className="c-tx5" />
              <p className="text-[10px] font-bold uppercase tracking-widest c-tx5">Mais activos</p>
            </div>
            <div className="p-3 space-y-2">
              {topContributors.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="text-[10px] c-tx5 w-4 text-right shrink-0">{i + 1}</span>
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[11px] c-tx3 flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] c-tx5">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Feed principal ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Topbar do feed */}
        <div id="tour-comunidade-topbar" className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar tópico..."
              className="pl-9 pr-4 py-2 rounded-lg c-s1 border c-br text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/50 w-full transition-colors" />
          </div>
          {/* Ordenação mobile */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="lg:hidden c-s1 border c-br rounded-lg px-3 py-2 text-xs c-tx outline-none">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="c-bg">{o.label}</option>)}
          </select>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0">
            <Plus size={14} /> <span className="hidden sm:inline">Nova publicação</span><span className="sm:hidden">Nova</span>
          </button>
        </div>

        {/* Categorias mobile */}
        <div className="flex gap-2 flex-wrap lg:hidden">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat ? "bg-blue-600 text-white" : "c-s1 c-tx4 border c-br hc-s2"}`}>
              {cat}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-20 text-center">
            <Globe className="mx-auto c-tx5 mb-4" size={32} strokeWidth={1} />
            <p className="text-sm c-tx5">Sem publicações.</p>
          </div>
        )}

        <div id="tour-comunidade-feed">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, index) => {
            const displayName = `${post.profiles?.first_name || ""} ${post.profiles?.last_name || ""}`.trim() || "Agente";
            const catStyle = CAT_STYLE[post.category] ?? { bg: "bg-blue-500/10", text: "text-blue-400" };
            const isLiked = myLikes.has(post.id);
            const likeCount = likeCounts[post.id] ?? 0;
            const commentCount = commentCounts[post.id] ?? 0;
            const isPinned = pinnedIds.has(post.id);
            const commentsOpen = expandedComments.has(post.id);
            const postComments = comments[post.id] ?? [];
            const isLong = post.content?.length > 300;
            const isExpanded = expandedContent.has(post.id);
            const isOwn = post.user_id === user?.id;

            return (
              <motion.div key={post.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ delay: index * 0.03 }}
                className={`c-bg2 border rounded-xl overflow-hidden transition-colors ${isPinned ? "border-amber-500/30" : "c-br hover:border-white/[0.12]"}`}>

                {isPinned && <div className="h-0.5 bg-amber-500 w-full" />}

                <div className="p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                        {displayName[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold c-tx">{displayName}</p>
                        <p className="text-[10px] c-tx5">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPinned && <span className="flex items-center gap-1 text-[10px] text-amber-400"><Pin size={10} /> Fixado</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${catStyle.bg} ${catStyle.text} border-current/20`}>{post.category}</span>
                      {isAdmin && (
                        <button onClick={() => togglePin(post.id)} title={isPinned ? "Desafixar" : "Fixar"}
                          className={`p-1.5 rounded-lg transition-colors ${isPinned ? "text-amber-400 bg-amber-500/10" : "c-tx5 hc-s2 hover:text-amber-400"}`}>
                          <Pin size={12} />
                        </button>
                      )}
                      {(isAdmin || isOwn) && (
                        <button onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg c-tx5 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <h3 className="text-sm font-semibold c-tx mb-1.5 leading-snug">{post.title}</h3>
                    <p className={`text-xs c-tx3 leading-relaxed whitespace-pre-wrap ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>
                      {post.content}
                    </p>
                    {isLong && (
                      <button onClick={() => setExpandedContent(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
                        className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors mt-1 flex items-center gap-1">
                        {isExpanded ? <><ChevronUp size={11} /> Recolher</> : <><ChevronDown size={11} /> Ver mais</>}
                      </button>
                    )}
                  </div>

                  {/* Acções */}
                  <div className="flex items-center gap-5 pt-2 border-t c-br">
                    <button onClick={() => toggleLike(post.id)} disabled={likeLoading === post.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? "text-red-400" : "c-tx5 hover:text-red-400"}`}>
                      <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                      <span>{likeCount > 0 ? likeCount : ""} Gosto{likeCount !== 1 ? "s" : ""}</span>
                    </button>
                    <button onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${commentsOpen ? "text-blue-400" : "c-tx5 hover:text-blue-400"}`}>
                      <MessageCircle size={13} />
                      <span>{commentCount > 0 ? commentCount : ""} Comentário{commentCount !== 1 ? "s" : ""}</span>
                    </button>
                  </div>
                </div>

                {/* Comentários */}
                <AnimatePresence>
                  {commentsOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border-t c-br bg-black/10 px-5 py-4 space-y-3">
                        {postComments.length === 0 ? (
                          <p className="text-[11px] c-tx5 text-center py-1">Sem comentários ainda. Sê o primeiro!</p>
                        ) : postComments.map(c => {
                          const cName = `${c.profiles?.first_name || ""} ${c.profiles?.last_name || ""}`.trim() || "Agente";
                          return (
                            <div key={c.id} className="flex gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0 mt-0.5">
                                {cName[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 c-s1 border c-br rounded-xl px-3 py-2">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-[10px] font-semibold c-tx2">{cName}</p>
                                  <p className="text-[9px] c-tx5">{timeAgo(c.created_at)}</p>
                                </div>
                                <p className="text-xs c-tx3 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          );
                        })}

                        {/* Input */}
                        <div className="flex gap-2 pt-1">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">
                            {user?.first_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              value={commentTexts[post.id] ?? ""}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(post.id); } }}
                              placeholder="Escreve um comentário..."
                              className="flex-1 c-s1 border c-br rounded-xl px-3 py-2 text-xs c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40 transition-colors"
                            />
                            <button onClick={() => handleSubmitComment(post.id)}
                              disabled={!commentTexts[post.id]?.trim() || commentSubmitting === post.id}
                              className="px-3 py-2 rounded-xl bg-blue-600 c-tx hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0">
                              {commentSubmitting === post.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                            </button>
                          </div>
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
      </div>

      {/* Modal nova publicação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg c-bg border c-br rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b c-br">
              <h3 className="text-sm font-semibold c-tx flex items-center gap-2"><Sparkles size={15} className="text-blue-400" /> Nova publicação</h3>
              <button onClick={() => setIsModalOpen(false)} className="c-tx4 hc-tx"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreatePost} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs c-tx3">Título</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Táctica para aulas práticas..."
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs c-tx3">Categoria</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx outline-none focus:border-blue-500/50 transition-colors">
                    {["Metodologia","Dúvidas","Casos de Sucesso","Avisos"].map(c => <option key={c} className="c-bg">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs c-tx3">Conteúdo</label>
                <textarea required rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Partilhe o seu conhecimento com a comunidade..."
                  className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/50 transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
