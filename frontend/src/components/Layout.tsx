import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Home, LogOut, MessageCircle, User, Warehouse } from "lucide-react";

interface ConversationSummary {
  id: string;
  unreadCount: number;
}

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user) return;

    function fetchUnread() {
      api<ConversationSummary[]>("/conversations").then((convs) => {
        setUnreadTotal(convs.reduce((sum, c) => sum + c.unreadCount, 0));
      }).catch(() => {});
    }

    fetchUnread();

    // Listen for real-time updates
    let cleanup: (() => void) | undefined;
    import("../lib/socket.js").then(({ connectSocket }) => {
      const s = connectSocket();
      const onNewMessage = () => fetchUnread();
      const onMessageSent = () => fetchUnread();
      s.on("new_message", onNewMessage);
      s.on("message_sent", onMessageSent);
      cleanup = () => {
        s.off("new_message", onNewMessage);
        s.off("message_sent", onMessageSent);
      };
    }).catch(() => {});

    return () => cleanup?.();
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl no-underline">
            <Warehouse className="w-6 h-6" />
            LeCabanon
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <Link to="/communities" className="text-gray-600 hover:text-primary-700 no-underline text-sm flex items-center gap-1">
                <Home className="w-4 h-4" />
                Communautés
              </Link>
              <Link to="/messages" className="text-gray-600 hover:text-primary-700 no-underline text-sm flex items-center gap-1 relative">
                <MessageCircle className="w-4 h-4" />
                Messages
                {unreadTotal > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-primary-700 no-underline text-sm flex items-center gap-1">
                <User className="w-4 h-4" />
                {user.firstName}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 cursor-pointer bg-transparent border-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        <Outlet />
      </main>
    </div>
  );
}
