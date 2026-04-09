import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Send, Check, CheckCheck, Package } from "lucide-react";

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
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const equipmentContext = searchParams.get("context") === "equipment" ? searchParams.get("equipmentName") : null;
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

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setMsgLoading(true);
    setMessages([]);
    setNextCursor(null);
    api<{ messages: MessageData[]; nextCursor: string | null }>(`/conversations/${conversationId}/messages`)
      .then((data) => {
        setMessages(data.messages.reverse());
        setNextCursor(data.nextCursor);
        // Mark as read — update unread count locally
        setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      })
      .finally(() => setMsgLoading(false));
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.io event listeners
  useEffect(() => {
    const socketModule = import("../lib/socket.js");
    let cleanup: (() => void) | undefined;

    socketModule.then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;

      const onNewMessage = (data: { message: MessageData; conversationId: string }) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => [...prev, data.message]);
          // Mark as read since we're viewing this conversation
          socket.emit("mark_read", { conversationId: data.conversationId });
        }
        // Update conversation list
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

    // Optimistic update
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
      // Try socket first
      const { getSocket } = await import("../lib/socket.js");
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("send_message", { conversationId, content });
      } else {
        // Fallback to REST
        const msg = await api<MessageData>(`/conversations/${conversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });
        setMessages((prev) => prev.map((m) => m.id === "pending" ? msg : m));
      }
    } catch {
      // Remove optimistic message on error
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
    if (diff < 172800000) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function StatusIcon({ status }: { status: string }) {
    if (status === "READ") return <CheckCheck className="w-3.5 h-3.5 text-primary-500" />;
    if (status === "DELIVERED") return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  }

  // Mobile: show list or conversation
  const showList = !conversationId;
  const showChat = !!conversationId;

  return (
    <div className="flex h-[calc(100vh-5rem)] -my-6 -mx-4 sm:mx-0 sm:my-0 sm:h-[calc(100vh-7rem)] bg-white dark:bg-gray-900 sm:rounded-xl sm:border sm:border-gray-200 dark:sm:border-gray-700 overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full sm:w-80 sm:border-r sm:border-gray-200 dark:sm:border-gray-700 flex flex-col shrink-0 ${showChat ? "hidden sm:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 px-4 text-center">
            Aucune conversation. Contactez un voisin depuis la page matériel ou membres !
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/messages/${c.id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${c.id === conversationId ? "bg-primary-50 dark:bg-primary-900/30" : "bg-transparent"}`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                    {c.other.firstName[0]}{c.other.lastName[0]}
                  </div>
                  {c.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.other.firstName} {c.other.lastName}</span>
                    {c.lastMessage && <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDate(c.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {c.lastMessage
                        ? (c.lastMessage.senderId === user?.id ? "Vous : " : "") + (c.lastMessage.content.length > 50 ? c.lastMessage.content.slice(0, 50) + "…" : c.lastMessage.content)
                        : "Nouvelle conversation"
                      }
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 ml-2 bg-primary-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{c.community.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${showList ? "hidden sm:flex" : "flex"}`}>
        {!conversationId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Sélectionnez une conversation
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <button onClick={() => navigate("/messages")} className="sm:hidden text-gray-500 bg-transparent border-none cursor-pointer p-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {activeConv && (
                <>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                      {activeConv.other.firstName[0]}{activeConv.other.lastName[0]}
                    </div>
                    {activeConv.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div>
                    <Link to={`/users/${activeConv.other.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 no-underline hover:underline">
                      {activeConv.other.firstName} {activeConv.other.lastName}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {typingUserId ? "En train d'écrire..." : activeConv.online ? "En ligne" : activeConv.community.name}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {nextCursor && (
                <button onClick={loadOlderMessages} className="w-full text-xs text-primary-600 py-2 bg-transparent border-none cursor-pointer hover:underline">
                  Charger les messages précédents
                </button>
              )}
              {msgLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Envoyez votre premier message !</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMine ? "bg-primary-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMine ? "text-primary-200" : "text-gray-400"}`}>
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

            {/* Equipment context banner */}
            {equipmentContext && (
              <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-t border-primary-200 dark:border-primary-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  À propos de <strong>{equipmentContext}</strong>
                </p>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer border-none disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
