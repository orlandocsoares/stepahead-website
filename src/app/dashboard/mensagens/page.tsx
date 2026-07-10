"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Send, Search, Loader2, MessageSquare, ArrowLeft, Smile, Trash2,
  PenSquare, Users, GraduationCap, UserCheck, ChevronDown,
  ChevronUp, Reply, X, Paperclip, FileText, Download
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type Conversation = {
  other_id: string; first_name: string; last_name: string;
  avatar_url?: string; role: string; last_message: string;
  created_at: string; from_user_id: string; unread_count: number;
};
type Message = {
  id: string; from_user_id: string; to_user_id: string;
  content: string; created_at: string; first_name: string; last_name: string;
  anexo_url?: string | null; anexo_nome?: string | null;
};

function isImageFile(name?: string | null) {
  return !!name && /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}
type Profile = { id: string; first_name: string; last_name: string; role: string; avatar_url?: string };

const EMOJIS = [
  "😊","😂","❤️","👍","🙏","👏","🎉","🔥","✅","💪",
  "😅","🤔","😍","😢","😮","🥳","😎","🤝","💡","📚",
  "✏️","📝","🎓","⭐","🙌","😁","🥰","😬","🤗","💬",
];

const ROLE_LABEL: Record<string, string> = {
  "super-admin": "Super Admin", admin: "Administrador",
  formador: "Formador", formando: "Formando",
};

const ROLE_COLOR: Record<string, string> = {
  "super-admin": "text-red-400 bg-red-500/10",
  admin: "text-amber-400 bg-amber-500/10",
  formador: "text-blue-400 bg-blue-500/10",
  formando: "text-emerald-400 bg-emerald-500/10",
};

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center text-xs font-bold`;
  if (url) return <img src={url} alt={name} className={`${cls} object-cover`} />;
  return (
    <div className={`${cls} bg-blue-600/20 border border-blue-500/20 text-blue-400`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[10px] c-tx5 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return formatTime(ts);
}

function MensagensInner() {
  const { user } = useAdminUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [meusFormadoresIds, setMeusFormadoresIds] = useState<Set<string>>(new Set());

  const [isComposing, setIsComposing] = useState(false);
  const [composeTarget, setComposeTarget] = useState<"formandos"|"formadores"|"todos"|"ids">("formandos");
  const [composeText, setComposeText] = useState("");
  const [composeIds, setComposeIds] = useState<string[]>([]);
  const [composeSearch, setComposeSearch] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeSent, setComposeSent] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") =>
    bottomRef.current?.scrollIntoView({ behavior });

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/mensagens?conversations=1");
    const { data } = await res.json();
    setConversations(data ?? []);
  }, []);

  const fetchMessages = useCallback(async (withId: string) => {
    const res = await fetch(`/api/mensagens?with=${withId}`);
    const { data } = await res.json();
    setMessages(data ?? []);
    setTimeout(() => scrollToBottom("auto"), 50);
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetch("/api/db/profiles?orderBy=first_name&ascending=true")
      .then(r => r.json()).then(({ data }) => setAllUsers(data ?? []));
  }, []);

  useEffect(() => {
    if (user?.role !== "formando") return;
    fetch("/api/meus-formadores")
      .then(r => r.json())
      .then(d => {
        const aceites = (d.associacoes ?? []).filter((a: any) => a.status === "aceite").map((a: any) => a.formador_id);
        setMeusFormadoresIds(new Set(aceites));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); setActiveProfile(null); return; }
    const profile = allUsers.find(u => u.id === activeId) ?? conversations.find(c => c.other_id === activeId) as any;
    setActiveProfile(profile ?? null);
    setLoadingMsgs(true);
    setReplyTo(null);
    fetchMessages(activeId).finally(() => setLoadingMsgs(false));
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(activeId), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, allUsers]);

  // Scroll button visibility
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const handler = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  async function handleDeleteMsg(id: string) {
    await fetch(`/api/mensagens?id=${id}`, { method: "DELETE" });
    if (activeId) fetchMessages(activeId);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!text.trim() && !anexoFile) || !activeId || !user) return;
    setSending(true); setSendError(null);
    try {
      let finalContent = text.trim();
      if (replyTo) {
        const preview = replyTo.content.length > 80 ? replyTo.content.slice(0, 80) + "…" : replyTo.content;
        const authorName = `${replyTo.first_name} ${replyTo.last_name}`.trim();
        finalContent = `> ${authorName}: ${preview}\n\n${finalContent}`;
      }

      let anexo_url: string | undefined;
      let anexo_nome: string | undefined;
      if (anexoFile) {
        setUploadingAnexo(true);
        const sanitized = anexoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}_${sanitized}`;
        const uploadForm = new FormData();
        uploadForm.append("bucket", "mensagens"); uploadForm.append("path", fileName); uploadForm.append("file", anexoFile);
        const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: uploadForm });
        setUploadingAnexo(false);
        if (!uploadRes.ok) throw new Error("Erro ao enviar o anexo.");
        anexo_url = `/storage/v1/object/public/mensagens/${fileName}`;
        anexo_nome = anexoFile.name;
      }

      const res = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: activeId, content: finalContent, anexo_url, anexo_nome }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Erro ao enviar mensagem.");
      setText(""); setReplyTo(null); setAnexoFile(null);
      await fetchMessages(activeId);
    } catch (err: any) {
      setSendError(err.message);
      setTimeout(() => setSendError(null), 5000);
    } finally { setSending(false); }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!composeText.trim()) return;
    if (composeTarget === "ids" && composeIds.length === 0) return;
    setComposeSending(true); setComposeSent(null);
    try {
      const res = await fetch("/api/mensagens/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatario: composeTarget, ids: composeTarget === "ids" ? composeIds : undefined, content: composeText.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar.");
      setComposeSent(json.sent);
      setComposeText(""); setComposeIds([]); setComposeSearch("");
      fetchConversations();
      setTimeout(() => { setIsComposing(false); setComposeSent(null); }, 2000);
    } catch (err: any) { alert(err.message); }
    finally { setComposeSending(false); }
  }

  const filteredConvs = conversations.filter(c => {
    const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });
  // Formandos só podem contactar os seus formadores aceites, coordenadores ou administradores.
  const isFormando = user?.role === "formando";
  const podeContactar = (u: Profile) => {
    if (!isFormando) return true;
    if (u.role === "admin" || u.role === "super-admin") return true;
    if (u.role === "formador") return meusFormadoresIds.has(u.id);
    return false;
  };
  const convIds = new Set(conversations.map(c => c.other_id));
  const newUsers = allUsers.filter(u => {
    if (u.id === user?.id || convIds.has(u.id)) return false;
    if (!podeContactar(u)) return false;
    const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Render messages com separadores de data e agrupamento
  type RenderItem =
    | { type: "date"; label: string; key: string }
    | { type: "message"; msg: Message; isFirst: boolean; isLast: boolean };

  const renderItems = (() => {
    const items: RenderItem[] = [];
    let lastDate = "";
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const dateLabel = formatDateLabel(msg.created_at);
      if (dateLabel !== lastDate) {
        items.push({ type: "date", label: dateLabel, key: `date-${i}` });
        lastDate = dateLabel;
      }
      const sameAsPrev = prev?.from_user_id === msg.from_user_id && dateLabel === formatDateLabel(prev?.created_at ?? "");
      const sameAsNext = next?.from_user_id === msg.from_user_id && formatDateLabel(next?.created_at ?? "") === dateLabel;
      items.push({ type: "message", msg, isFirst: !sameAsPrev, isLast: !sameAsNext });
    }
    return items;
  })();

  return (
    <div className="w-full h-full flex gap-3 min-h-0">

      {/* ── Sidebar: conversas ── */}
      <div id="tour-conversations-sidebar" className={`flex flex-col c-bg2 border c-br rounded-xl overflow-hidden
        ${activeId ? "hidden md:flex" : "flex"} w-full md:w-72 lg:w-80 shrink-0`}>

        <div className="p-3 border-b c-br space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold c-tx">Mensagens</h2>
            <button id="tour-compose-btn" onClick={() => { setIsComposing(true); setComposeTarget(isFormando ? "ids" : "formandos"); setComposeText(""); setComposeIds([]); setComposeSearch(""); setComposeSent(null); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition-colors text-xs font-medium">
              <PenSquare size={12} /> Enviar
            </button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
              className="w-full pl-8 pr-3 py-2 c-s1 border c-br rounded-lg text-xs c-tx placeholder:c-tx4 outline-none focus:border-blue-500/40 transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map(conv => {
            const name = `${conv.first_name} ${conv.last_name}`;
            const isActive = activeId === conv.other_id;
            const hasUnread = conv.unread_count > 0 && !isActive;
            return (
              <button key={conv.other_id} onClick={() => router.push(`/dashboard/mensagens?with=${conv.other_id}`)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all border-b border-white/[0.03] group relative
                  ${isActive ? "bg-blue-600/10 border-l-2 border-l-blue-500" : hasUnread ? "border-l-2 border-l-red-500 bg-red-500/[0.03]" : "border-l-2 border-l-transparent hc-s1"}`}>
                <div className="relative shrink-0">
                  <Avatar name={name} url={conv.avatar_url} size={9} />
                  {hasUnread && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
                      {conv.unread_count > 9 ? "9+" : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className={`text-xs truncate ${hasUnread ? "font-bold c-tx" : "font-medium c-tx2"}`}>{name}</p>
                    <span className={`text-[10px] shrink-0 ${hasUnread ? "text-red-400 font-semibold" : "c-tx5"}`}>{timeAgo(conv.created_at)}</span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? "c-tx3 font-medium" : "c-tx5"}`}>
                    {conv.from_user_id === user?.id ? <span className="c-tx5">Tu: </span> : ""}{conv.last_message}
                  </p>
                </div>
              </button>
            );
          })}

          {newUsers.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest c-tx5">Nova conversa</p>
              {newUsers.map(u => (
                <button key={u.id} onClick={() => router.push(`/dashboard/mensagens?with=${u.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left hc-s1 transition-colors border-b border-white/[0.03]
                    ${activeId === u.id ? "bg-blue-600/10 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"}`}>
                  <Avatar name={`${u.first_name} ${u.last_name}`} url={u.avatar_url} size={9} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium c-tx2 truncate">{u.first_name} {u.last_name}</p>
                    <p className={`text-[10px] font-medium ${ROLE_COLOR[u.role] ?? "c-tx5"} inline-block px-1.5 py-0.5 rounded mt-0.5`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          {conversations.length === 0 && newUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <MessageSquare size={24} className="c-tx5" strokeWidth={1} />
              <p className="text-xs c-tx5">Sem utilizadores disponíveis</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Área de chat ── */}
      <div id="tour-chat-area" className={`flex-1 flex flex-col c-bg2 border c-br rounded-xl overflow-hidden min-w-0 ${!activeId ? "hidden md:flex" : "flex"}`}>

        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl c-s1 border c-br flex items-center justify-center">
              <MessageSquare size={28} className="c-tx5" strokeWidth={1} />
            </div>
            <div>
              <p className="text-sm font-medium c-tx3">Selecciona uma conversa</p>
              <p className="text-xs c-tx5 mt-1">Escolhe alguém da lista para começar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b c-br shrink-0">
              <button onClick={() => router.push("/dashboard/mensagens")} className="md:hidden c-tx3 hc-tx mr-1">
                <ArrowLeft size={18} />
              </button>
              {activeProfile && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={`${activeProfile.first_name} ${activeProfile.last_name}`} url={activeProfile.avatar_url} size={9} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold c-tx">{activeProfile.first_name} {activeProfile.last_name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_COLOR[activeProfile.role] ?? "c-tx5"}`}>
                      {ROLE_LABEL[activeProfile.role] ?? activeProfile.role}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagens */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 relative">
              {loadingMsgs ? (
                <div className="flex justify-center pt-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-xs c-tx5">Sem mensagens ainda. Envia a primeira!</p>
                </div>
              ) : (
                renderItems.map(item => {
                  if (item.type === "date") return <DateSeparator key={item.key} label={item.label} />;
                  const { msg, isFirst, isLast } = item;
                  const isMe = msg.from_user_id === user?.id;

                  // Detectar se é uma resposta (começa com "> ")
                  const isReply = (msg.content ?? "").startsWith("> ");
                  let quoteText = "";
                  let mainText = msg.content ?? "";
                  if (isReply) {
                    const parts = (msg.content ?? "").split("\n\n");
                    quoteText = parts[0].replace(/^> /, "");
                    mainText = parts.slice(1).join("\n\n") || msg.content || "";
                  }

                  return (
                    <div key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2 group/msg
                        ${isFirst ? "mt-3" : "mt-0.5"}`}>
                      {/* Avatar só no 1º da sequência */}
                      {!isMe && (
                        <div className="w-7 shrink-0 self-end">
                          {isLast && <Avatar name={`${msg.first_name} ${msg.last_name}`} size={7} />}
                        </div>
                      )}

                      <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {/* Nome só no 1º da sequência (para o interlocutor) */}
                        {!isMe && isFirst && (
                          <p className="text-[10px] c-tx4 mb-1 ml-1">{msg.first_name}</p>
                        )}
                        <div className="relative group/bubble">
                          <div className={`px-3.5 py-2.5 relative
                            ${isMe ? "bg-blue-600 c-tx" : "c-s2 c-tx2"}
                            ${isFirst && isLast ? "rounded-2xl" :
                              isFirst ? isMe ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm" :
                              isLast  ? isMe ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm" :
                              isMe    ? "rounded-l-2xl rounded-r-sm" : "rounded-r-2xl rounded-l-sm"}`}>

                            {/* Citação */}
                            {isReply && quoteText && (
                              <div className={`text-[10px] mb-2 px-2 py-1 rounded border-l-2 ${isMe ? "border-blue-300/50 bg-blue-500/20 text-blue-100/70" : "border-white/20 bg-white/5 c-tx4"}`}>
                                {quoteText}
                              </div>
                            )}
                            {msg.anexo_url && (
                              isImageFile(msg.anexo_nome) ? (
                                <a href={msg.anexo_url} target="_blank" rel="noopener noreferrer" className="block mb-2 -mx-0.5">
                                  <img src={msg.anexo_url} alt={msg.anexo_nome ?? "Anexo"} className="max-w-full max-h-52 rounded-lg object-cover" />
                                </a>
                              ) : (
                                <a href={msg.anexo_url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-2 mb-2 px-2.5 py-2 rounded-lg border ${isMe ? "border-white/20 bg-white/10 hover:bg-white/15" : "c-br c-s1 hc-s2"} transition-colors`}>
                                  <FileText size={14} className={isMe ? "text-white/80 shrink-0" : "c-tx4 shrink-0"} />
                                  <span className="text-xs truncate flex-1">{msg.anexo_nome ?? "Anexo"}</span>
                                  <Download size={12} className={isMe ? "text-white/60 shrink-0" : "c-tx5 shrink-0"} />
                                </a>
                              )
                            )}
                            {mainText && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{mainText}</p>}
                            <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200/60" : "c-tx5"} ${isMe ? "text-right" : ""}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>

                          {/* Acções ao hover */}
                          <div className={`absolute top-1 ${isMe ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1`}>
                            <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                              className="p-1.5 rounded-lg c-bg border c-br c-tx4 hover:text-blue-400 hover:border-blue-500/30 transition-colors">
                              <Reply size={11} />
                            </button>
                            {isMe && (
                              <button onClick={() => handleDeleteMsg(msg.id)}
                                className="p-1.5 rounded-lg c-bg border c-br c-tx4 hover:text-red-400 hover:border-red-500/30 transition-colors">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {isMe && <div className="w-7 shrink-0" />}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-24 right-8 z-10 w-9 h-9 rounded-full c-bg2 border c-br c-tx3 hover:c-tx shadow-lg flex items-center justify-center transition-colors">
                  <ChevronDown size={16} />
                </motion.button>
              )}
            </AnimatePresence>

            {sendError && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{sendError}</div>
            )}

            {/* Emoji picker */}
            {showEmojis && (
              <div className="mx-4 mb-2 p-3 c-bg border c-br rounded-xl grid grid-cols-10 gap-1">
                {EMOJIS.map(emoji => (
                  <button key={emoji} type="button"
                    onClick={() => {
                      const ta = textareaRef.current;
                      if (!ta) { setText(t => t + emoji); return; }
                      const s = ta.selectionStart; const e2 = ta.selectionEnd;
                      setText(text.slice(0, s) + emoji + text.slice(e2));
                      setTimeout(() => { ta.focus(); ta.setSelectionRange(s + emoji.length, s + emoji.length); }, 0);
                      setShowEmojis(false);
                    }}
                    className="text-lg hc-s3 rounded-lg p-1 transition-colors leading-none">
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Reply preview */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mx-4 mb-1">
                  <div className="flex items-center gap-2 px-3 py-2 c-s1 border-l-2 border-blue-500 rounded-r-lg bg-blue-500/5">
                    <Reply size={12} className="text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blue-400 font-medium">{replyTo.first_name} {replyTo.last_name}</p>
                      <p className="text-[11px] c-tx4 truncate">{replyTo.content.slice(0, 100)}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="c-tx5 hover:c-tx3 transition-colors shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Anexo seleccionado */}
            {anexoFile && (
              <div className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 c-s1 border c-br rounded-lg">
                <Paperclip size={13} className="text-blue-400 shrink-0" />
                <span className="text-xs c-tx3 truncate flex-1">{anexoFile.name}</span>
                <button type="button" onClick={() => { setAnexoFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="c-tx5 hover:c-tx3 transition-colors shrink-0">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-end gap-2 p-3 border-t c-br shrink-0">
              <input ref={fileInputRef} type="file" className="sr-only" onChange={e => setAnexoFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl transition-colors shrink-0 c-tx4 hc-tx hc-s2">
                <Paperclip size={18} />
              </button>
              <button type="button" onClick={() => setShowEmojis(s => !s)}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${showEmojis ? "bg-blue-600/20 text-blue-400" : "c-tx4 hc-tx hc-s2"}`}>
                <Smile size={18} />
              </button>
              <textarea ref={textareaRef} value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Escreve uma mensagem…"
                rows={1}
                className="flex-1 c-s1 border c-br rounded-xl px-4 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40 resize-none max-h-32 transition-colors"
                style={{ minHeight: "42px" }}
              />
              <button type="submit" disabled={(!text.trim() && !anexoFile) || sending || uploadingAnexo}
                className="p-2.5 rounded-xl bg-blue-600 c-tx hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0">
                {sending || uploadingAnexo ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Modal broadcast */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="c-bg border c-br c-tx max-w-lg rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b c-br">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <PenSquare size={15} className="text-blue-400" /> Enviar mensagem em grupo
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBroadcast} className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs c-tx3">Destinatários</label>
              <div className="grid grid-cols-2 gap-2">
                {(isFormando
                  ? [{ value: "ids", label: "Selecção manual", icon: ChevronDown }]
                  : [
                      { value: "formandos",  label: "Todos os formandos",   icon: GraduationCap },
                      { value: "formadores", label: "Todos os formadores",   icon: UserCheck },
                      { value: "todos",      label: "Todos os utilizadores", icon: Users },
                      { value: "ids",        label: "Selecção manual",       icon: ChevronDown },
                    ]
                ).map(opt => {
                  const Icon = opt.icon;
                  const sel = composeTarget === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setComposeTarget(opt.value as any)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${sel ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "c-br c-s1 c-tx3 hc-s2"}`}>
                      <Icon size={14} className={sel ? "text-blue-400" : "c-tx4"} />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {composeTarget === "ids" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
                  <input value={composeSearch} onChange={e => setComposeSearch(e.target.value)} placeholder="Nome do utilizador..."
                    className="w-full pl-8 pr-3 py-2 c-s1 border c-br rounded-lg text-xs c-tx placeholder:c-tx4 outline-none focus:border-blue-500/40" />
                </div>
                {composeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {composeIds.map(id => {
                      const u = allUsers.find(u => u.id === id);
                      return u ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 text-[11px] border border-blue-500/30">
                          {u.first_name} {u.last_name}
                          <button type="button" onClick={() => setComposeIds(prev => prev.filter(x => x !== id))} className="ml-0.5 hover:text-white">×</button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto c-s1 border c-br rounded-lg">
                  {allUsers.filter(u => {
                    if (u.id === user?.id || composeIds.includes(u.id)) return false;
                    if (!podeContactar(u)) return false;
                    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
                    return composeSearch ? name.includes(composeSearch.toLowerCase()) : true;
                  }).slice(0, 20).map(u => (
                    <button key={u.id} type="button"
                      onClick={() => { setComposeIds(prev => [...prev, u.id]); setComposeSearch(""); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hc-s2 transition-colors border-b border-white/[0.03] last:border-0">
                      <Avatar name={`${u.first_name} ${u.last_name}`} url={u.avatar_url} size={7} />
                      <div>
                        <p className="text-xs c-tx2 font-medium">{u.first_name} {u.last_name}</p>
                        <p className="text-[10px] c-tx4">{ROLE_LABEL[u.role] ?? u.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs c-tx3">Mensagem</label>
              <textarea required value={composeText} onChange={e => setComposeText(e.target.value)}
                placeholder="Escreve a tua mensagem..." rows={4}
                className="w-full c-s1 border c-br rounded-lg px-3 py-2.5 text-sm c-tx placeholder:c-tx4 outline-none focus:border-blue-500/40 resize-none transition-colors" />
            </div>
            {composeSent !== null && (
              <p className="text-xs text-emerald-400 text-center">✓ Enviado para {composeSent} {composeSent === 1 ? "utilizador" : "utilizadores"}</p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsComposing(false)} className="flex-1 py-2.5 rounded-xl border c-br text-sm c-tx3 hc-tx transition-colors">Cancelar</button>
              <button type="submit" disabled={composeSending || !composeText.trim() || (composeTarget === "ids" && composeIds.length === 0)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm c-tx font-medium hover:bg-blue-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {composeSending ? <><Loader2 size={14} className="animate-spin" /> A enviar...</> : <><Send size={14} /> Enviar</>}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MensagensPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 size={24} className="animate-spin text-blue-500" /></div>}>
      <MensagensInner />
    </Suspense>
  );
}
