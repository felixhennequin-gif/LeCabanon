import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, MessageCircle, User, LogOut, Wrench, HardHat, Users, Settings, X } from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  communityId?: string;
  communityCounts?: { equipment: number; artisans: number; members: number };
  isAdmin?: boolean;
}

export function MobileDrawer({ isOpen, onClose, communityId, communityCounts, isAdmin }: MobileDrawerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  function handleLogout() {
    logout();
    navigate("/login");
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-[var(--color-overlay)] z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 bg-[var(--color-card)] z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <span className="font-bold text-primary-600">Menu</span>
          <button onClick={onClose} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1 overflow-y-auto h-[calc(100%-4rem)]">
          {/* Community section */}
          {communityId && communityCounts && (
            <>
              <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider px-3 mb-1">Communauté</p>
              <DrawerLink to={`/communities/${communityId}/equipment`} icon={<Wrench className="w-5 h-5" strokeWidth={1.5} />} label="Matériel" badge={communityCounts.equipment} onClose={onClose} />
              <DrawerLink to={`/communities/${communityId}/artisans`} icon={<HardHat className="w-5 h-5" strokeWidth={1.5} />} label="Artisans" badge={communityCounts.artisans} onClose={onClose} />
              <DrawerLink to={`/communities/${communityId}/members`} icon={<Users className="w-5 h-5" strokeWidth={1.5} />} label="Membres" badge={communityCounts.members} onClose={onClose} />
              {isAdmin && (
                <DrawerLink to={`/communities/${communityId}/admin`} icon={<Settings className="w-5 h-5" strokeWidth={1.5} />} label="Administration" onClose={onClose} />
              )}
              <div className="border-t border-[var(--color-border)] my-3" />
            </>
          )}

          {/* Global section */}
          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider px-3 mb-1">Navigation</p>
          <DrawerLink to="/communities" icon={<Home className="w-5 h-5" strokeWidth={1.5} />} label="Communautés" onClose={onClose} />
          <DrawerLink to="/messages" icon={<MessageCircle className="w-5 h-5" strokeWidth={1.5} />} label="Messages" onClose={onClose} />
          <DrawerLink to="/profile" icon={<User className="w-5 h-5" strokeWidth={1.5} />} label={user?.firstName ?? "Profil"} onClose={onClose} />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-[var(--radius-button)] bg-transparent border-none cursor-pointer w-full text-left"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            Déconnexion
          </button>
        </nav>
      </div>
    </>
  );
}

function DrawerLink({ to, icon, label, badge, onClose }: { to: string; icon: React.ReactNode; label: string; badge?: number; onClose: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] rounded-[var(--radius-button)] no-underline"
    >
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="text-xs text-[var(--color-text-tertiary)]">{badge}</span>
      )}
    </Link>
  );
}
