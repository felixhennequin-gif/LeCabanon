import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { Avatar } from "../components/Avatar";
import { ArrowLeft, Send, Check, CheckCheck, Wrench, X } from "lucide-react";

interface ConversationSummary {
  id: string;
  other: { id: string; firstName: string; lastName: string; photo?: string | null };
  community: { id: string; name: string };
  lastMessage: { id: string; content: string; createdAt: string; status: string; senderId: string } | null;
  unreadCount: number;
  online: boolean;
  updatedAt: string;
}

interface MessageData {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; photo?: string | null };
}

export function Messages() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useLocalizedNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [equipmentCtx, setEquipmentCtx] = useState<{ id: string; name: string } | null>(
    (location.state as { equipmentContext?: { id: string; name: string } } | null)?.equipmentContext ?? null,
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingEmit = useRef(0);

  const activeConv = conversations.find((c) => c.id === conversationId);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api<ConversationSummary[]>("/conversations");
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setMsgLoading(true);
    setMessages([]);
    setNextCursor(null);
    api<{ messages: MessageData[]; nextCursor: string | null }>(`/conversations/${conversationId}/messages`)
      .then((data) => {
        setMessages(data.messages.reverse());
        setNextCursor(data.nextCursor);
        setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
        import("../lib/socket.js").then(({ getSocket }) => {
          getSocket()?.emit("mark_read", { conversationId });
        }).catch(() => {});
      })
      .finally(() => setMsgLoading(false));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socketModule = import("../lib/socket.js");
    let cleanup: (() => void) | undefined;

    socketModule.then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;

      const onNewMessage = (data: { message: MessageData; conversationId: string }) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => [...prev, data.message]);
          socket.emit("mark_read", { conversationId: data.conversationId });
        }
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id === data.conversationId) {
              return {
                ...c,
                lastMessage: { id: data.message.id, content: data.message.content, createdAt: data.message.createdAt, status: data.message.status, senderId: data.message.senderId },
                unreadCount: data.conversationId === conversationId ? 0 : c.unreadCount + 1,
                updatedAt: data.message.createdAt,
              };
            }
            return c;
          });
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
      };

      const onMessageSent = (data: { messageId: string; conversationId: string }) => {
        setMessages((prev) => prev.map((m) => m.id === "pending" ? { ...m, id: data.messageId } : m));
      };

      const onMessagesRead = (data: { conversationId: string }) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => prev.map((m) => m.senderId === user?.id ? { ...m, status: "READ" } : m));
        }
      };

      const onUserTyping = (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === conversationId) {
          setTypingUserId(data.userId);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000);
        }
      };

      const onUserOnline = (data: { userId: string }) => {
        setConversations((prev) => prev.map((c) => c.other.id === data.userId ? { ...c, online: true } : c));
      };
      const onUserOffline = (data: { userId: string }) => {
        setConversations((prev) => prev.map((c) => c.other.id === data.userId ? { ...c, online: false } : c));
      };

      socket.on("new_message", onNewMessage);
      socket.on("message_sent", onMessageSent);
      socket.on("messages_read", onMessagesRead);
      socket.on("user_typing", onUserTyping);
      socket.on("user_online", onUserOnline);
      socket.on("user_offline", onUserOffline);

      cleanup = () => {
        socket.off("new_message", onNewMessage);
        socket.off("message_sent", onMessageSent);
        socket.off("messages_read", onMessagesRead);
        socket.off("user_typing", onUserTyping);
        socket.off("user_online", onUserOnline);
        socket.off("user_offline", onUserOffline);
      };
    });

    return () => { cleanup?.(); };
  }, [conversationId, user?.id]);

  async function handleSend() {
    if (!input.trim() || !conversationId || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    if (equipmentCtx) {
      window.history.replaceState({}, '');
    }

    const optimisticMsg: MessageData = {
      id: "pending",
      content,
      status: "SENT",
      createdAt: new Date().toISOString(),
      senderId: user!.id,
      sender: { id: user!.id, firstName: user!.firstName, lastName: user!.lastName, photo: user!.photo },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { getSocket } = await import("../lib/socket.js");
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("send_message", { conversationId, content, ...(equipmentCtx && { equipmentId: equipmentCtx.id }) });
      } else {
        const msg = await api<MessageData>(`/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content, ...(equipmentCtx && { equipmentId: equipmentCtx.id }) }),
        });
        setMessages((prev) => prev.map((m) => m.id === "pending" ? msg : m));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== "pending"));
    } finally {
      setSending(false);
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (conversationId && Date.now() - lastTypingEmit.current > 1000) {
      lastTypingEmit.current = Date.now();
      import("../lib/socket.js").then(({ getSocket }) => {
        getSocket()?.emit("typing", { conversationId });
      });
    }
  }

  async function loadOlderMessages() {
    if (!nextCursor || !conversationId) return;
    const data = await api<{ messages: MessageData[]; nextCursor: string | null }>(`/conversations/${conversationId}/messages?cursor=${nextCursor}`);
    setMessages((prev) => [...data.messages.reverse(), ...prev]);
    setNextCursor(data.nextCursor);
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) return formatTime(dateStr);
    if (diff < 172800000) return tc("time.yesterday");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function StatusIcon({ status }: { status: string }) {
    if (status === "READ") return <CheckCheck className="w-3.5 h-3.5 text-primary-400" />;
    if (status === "DELIVERED") return <CheckCheck className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />;
    return <Check className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />;
  }

  const showList = !conversationId;
  const showChat = !!conversationId;

  return (
    <div className="flex h-[calc(100vh-5rem)] -my-6 -mx-4 sm:mx-0 sm:my-0 sm:h-[calc(100vh-7rem)] bg-[var(--color-card)] sm:rounded-[var(--radius-card)] sm:border sm:border-[var(--color-border)] overflow-hidden">
      <div className={`w-full sm:w-80 sm:border-r sm:border-[var(--color-border)] flex flex-col shrink-0 ${showChat ? "hidden sm:flex" : "flex"}`}>
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("messages.title")}</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-tertiary)] px-4 text-center">
            {t("messages.empty")}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/app/messages/${c.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-none cursor-pointer hover:bg-[var(--color-hover)] ${c.id === conversationId ? "bg-primary-50" : "bg-transparent"}`}
              >
                <div className="relative shrink-0">
                  <Avatar src={c.other.photo} name={`${c.other.firstName} ${c.other.lastName}`} size="md" />
                  {c.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--color-success)] rounded-full border-2 border-[var(--color-card)]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.other.firstName} {c.other.lastName}</span>
                    {c.lastMessage && <span className="text-xs text-[var(--color-text-tertiary)] shrink-0 ml-2">{formatDate(c.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {c.lastMessage
                        ? (c.lastMessage.senderId === user?.id ? t("messages.you_prefix") : "") + (c.lastMessage.content.length > 50 ? c.lastMessage.content.slice(0, 50) + "\u2026" : c.lastMessage.content)
                        : t("messages.new_conversation")
                      }
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 ml-2 bg-primary-600 text-[var(--color-page)] text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{c.community.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${showList ? "hidden sm:flex" : "flex"}`}>
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">
            {t("messages.select")}
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
              <button onClick={() => navigate("/app/messages")} className="sm:hidden text-[var(--color-text-secondary)] bg-transparent border-none cursor-pointer p-0">
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              {activeConv && (
                <>
                  <div className="relative">
                    <Avatar src={activeConv.other.photo} name={`${activeConv.other.firstName} ${activeConv.other.lastName}`} size="sm" />
                    {activeConv.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--color-success)] rounded-full border-2 border-[var(--color-card)]" />}
                  </div>
                  <div>
                    <LocalizedLink to={`/app/users/${activeConv.other.id}`} className="text-sm font-medium text-[var(--color-text-primary)] no-underline hover:underline">
                      {activeConv.other.firstName} {activeConv.other.lastName}
                    </LocalizedLink>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {typingUserId ? t("messages.typing") : activeConv.online ? t("messages.online") : activeConv.community.name}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {nextCursor && (
                <button onClick={loadOlderMessages} className="w-full text-xs text-primary-600 py-2 bg-transparent border-none cursor-pointer hover:underline">
                  {t("messages.load_older")}
                </button>
              )}
              {msgLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">{t("messages.first_message")}</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMine ? "bg-primary-600 text-[var(--color-page)] rounded-br-sm" : "bg-[var(--color-input)] text-[var(--color-text-primary)] rounded-bl-sm"}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMine ? "text-primary-200" : "text-[var(--color-text-tertiary)]"}`}>
                          <span className="text-xs">{formatTime(m.createdAt)}</span>
                          {isMine && <StatusIcon status={m.status} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-[var(--color-border)]">
              {equipmentCtx && (
                <div
                  className="flex items-center gap-2 mb-2 px-3 py-2 bg-[var(--color-primary-50)] text-[var(--color-primary-800)] rounded-[var(--radius-input)]"
                  style={{ borderLeft: '3px solid var(--color-primary-400)' }}
                >
                  <Wrench className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-[13px]">
                    {t("messages.equipment_context_label")} <strong>{equipmentCtx.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEquipmentCtx(null); window.history.replaceState({}, ''); }}
                    className="p-0.5 text-[var(--color-primary-600)] bg-transparent border-none cursor-pointer flex"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={t("messages.send_placeholder")}
                  className="flex-1 px-4 py-2 border border-[var(--color-border-strong)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary-600 text-[var(--color-page)] flex items-center justify-center cursor-pointer border-none disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
