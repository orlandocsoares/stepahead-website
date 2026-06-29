"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, Search, Loader2, MessageSquare, ArrowLeft, Smile, Trash2 } from "lucide-react";

type Conversation = {
  other_id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
  last_message: string;
  created_at: string;
  from_user_id: string;
  unread_count: number;
};

type Message = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
  first_name: string;
  last_name: string;
};

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
};

const EMOJIS = [
  "😊","😂","❤️","👍","🙏","👏","🎉","🔥","✅","💪",
  "😅","🤔","😍","😢","😮","🥳","😎","🤝","💡","📚",
  "✏️","📝","🎓","⭐","🙌","😁","🥰","😬","🤗","💬",
];

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center text-xs font-bold`;
  if (url) return <img src={url} alt={name} className={`${cls} object-cover`} />;
  return (
    <div className={`${cls} bg-blue-600/20 border border-blue-500/20 text-blue-400`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
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
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/mensagens?conversations=1");
    const { data } = await res.json();
    setConversations(data ?? []);
  }, []);

  const fetchMessages = useCallback(async (withId: string) => {
    const res = await fetch(`/api/mensagens?with=${withId}`);
    const { data } = await res.json();
    setMessages(data ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    fetchConversations();
  }, [fetchConversations]);

  // Carregar lista de todos os utilizadores para nova conversa
  useEffect(() => {
    fetch("/api/db/profiles?orderBy=first_name&ascending=true")
      .then(r => r.json())
      .then(({ data }) => setAllUsers(data ?? []));
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); setActiveProfile(null); return; }
    const profile = allUsers.find(u => u.id === activeId) ??
      conversations.find(c => c.other_id === activeId) as any;
    setActiveProfile(profile ?? null);
    setLoadingMsgs(true);
    fetchMessages(activeId).finally(() => setLoadingMsgs(false));

    // Polling a cada 5s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(activeId), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, allUsers]);

  async function handleDeleteMsg(id: string) {
    await fetch(`/api/mensagens?id=${id}`, { method: "DELETE" });
    if (activeId) fetchMessages(activeId);
  }


  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeId || !user) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: activeId, content: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Erro ao enviar mensagem.");
      setText("");
      await fetchMessages(activeId);
    } catch (err: any) {
      setSendError(err.message);
      setTimeout(() => setSendError(null), 5000);
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = allUsers.filter(u => {
    if (u.id === user?.id) return false;
    const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Lista de conversas + utilizadores sem conversa ainda
  const convIds = new Set(conversations.map(c => c.other_id));
  const newUsers = filteredUsers.filter(u => !convIds.has(u.id));

  const ROLE_LABEL: Record<string, string> = {
    "super-admin": "Super Admin", admin: "Admin", formador: "Formador", formando: "Formando",
  };

  function formatTime(d: string) {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  }

  return (
    <div className="w-full h-full flex gap-4 min-h-0">

      {/* Coluna esquerda — conversas */}
      <div className={`flex flex-col c-bg2 border c-br rounded-xl overflow-hidden
        ${activeId ? "hidden md:flex" : "flex"} w-full md:w-72 lg:w-80 shrink-0`}>

        <div className="p-4 border-b c-br">
          <h2 className="text-sm font-semibold c-tx mb-3">Mensagens</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 c-tx4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar utilizador..."
              className="w-full pl-8 pr-3 py-2 c-s1 border c-br rounded-lg text-xs c-tx placeholder:c-tx4 outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Conversas existentes */}
          {conversations.filter(c => {
            const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase();
            return name.includes(search.toLowerCase());
          }).map(conv => (
            <button
              key={conv.other_id}
              onClick={() => router.push(`/dashboard/mensagens?with=${conv.other_id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hc-s1 transition-colors border-b border-white/[0.03]
                ${activeId === conv.other_id ? "bg-blue-600/10 border-l-2 border-l-blue-500" : ""}`}
            >
              <div className="relative">
                <Avatar name={`${conv.first_name} ${conv.last_name}`} url={conv.avatar_url} size={9} />
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] c-tx flex items-center justify-center font-bold">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className={`text-xs font-semibold truncate ${conv.unread_count > 0 ? "c-tx" : "c-tx2"}`}>
                    {conv.first_name} {conv.last_name}
                  </p>
                  <span className="text-[10px] c-tx4 shrink-0 ml-2">{formatTime(conv.created_at)}</span>
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${conv.unread_count > 0 ? "c-tx2" : "c-tx4"}`}>
                  {conv.from_user_id === user?.id ? "Tu: " : ""}{conv.last_message}
                </p>
              </div>
            </button>
          ))}

          {/* Utilizadores sem conversa ainda */}
          {newUsers.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest c-tx5">Nova conversa</p>
              {newUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => router.push(`/dashboard/mensagens?with=${u.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hc-s1 transition-colors border-b border-white/[0.03]
                    ${activeId === u.id ? "bg-blue-600/10 border-l-2 border-l-blue-500" : ""}`}
                >
                  <Avatar name={`${u.first_name} ${u.last_name}`} url={u.avatar_url} size={9} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold c-tx2 truncate">{u.first_name} {u.last_name}</p>
                    <p className="text-[10px] c-tx4">{ROLE_LABEL[u.role] ?? u.role}</p>
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

      {/* Área de chat */}
      <div className={`flex-1 flex flex-col c-bg2 border c-br rounded-xl overflow-hidden min-w-0
        ${!activeId ? "hidden md:flex" : "flex"}`}>

        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <MessageSquare size={32} className="c-tx5" strokeWidth={1} />
            <p className="text-sm c-tx5">Selecciona uma conversa para começar</p>
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="flex items-center gap-3 px-4 py-3 border-b c-br shrink-0">
              <button onClick={() => router.push("/dashboard/mensagens")} className="md:hidden c-tx3 hc-tx mr-1">
                <ArrowLeft size={18} />
              </button>
              {activeProfile && (
                <>
                  <Avatar name={`${activeProfile.first_name} ${activeProfile.last_name}`} url={activeProfile.avatar_url} size={8} />
                  <div>
                    <p className="text-sm font-semibold c-tx">{activeProfile.first_name} {activeProfile.last_name}</p>
                    <p className="text-[10px] c-tx4">{ROLE_LABEL[activeProfile.role] ?? activeProfile.role}</p>
                  </div>
                </>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center pt-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  <p className="text-xs c-tx5">Sem mensagens ainda. Envia a primeira!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.from_user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2 group/msg`}>
                      {!isMe && <Avatar name={`${msg.first_name} ${msg.last_name}`} size={7} />}
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 relative ${
                        isMe
                          ? "bg-blue-600 c-tx rounded-tr-sm"
                          : "c-s2 c-tx2 rounded-tl-sm"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200/60" : "c-tx4"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                        {isMe && (
                          <button
                            onClick={() => handleDeleteMsg(msg.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full c-bg border c-br2 c-tx4 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-all"
                            title="Eliminar mensagem"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Erro de envio */}
            {sendError && (
              <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {sendError}
              </div>
            )}

            {/* Picker de emojis */}
            {showEmojis && (
              <div className="mx-4 mb-2 p-3 c-bg border c-br rounded-xl grid grid-cols-10 gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      const ta = textareaRef.current;
                      if (!ta) { setText(t => t + emoji); return; }
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const next = text.slice(0, start) + emoji + text.slice(end);
                      setText(next);
                      // repõe o cursor depois do emoji
                      setTimeout(() => { ta.focus(); ta.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
                      setShowEmojis(false);
                    }}
                    className="text-lg hc-s3 rounded-lg p-1 transition-colors leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-end gap-3 p-4 border-t c-br shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojis(s => !s)}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${showEmojis ? "bg-blue-600/20 text-blue-400" : "c-tx4 hc-tx hc-s2"}`}
              >
                <Smile size={18} />
              </button>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Escreve uma mensagem... (Enter para enviar)"
                rows={1}
                className="flex-1 c-s1 border c-br rounded-xl px-4 py-2.5 text-sm c-tx placeholder:c-tx5 outline-none focus:border-blue-500/40 resize-none max-h-32 transition-colors"
                style={{ minHeight: "42px" }}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="p-2.5 rounded-xl bg-blue-600 c-tx hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </div>
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
