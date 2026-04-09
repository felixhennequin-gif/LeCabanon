import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, LogOut, User, Warehouse } from "lucide-react";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
