import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "./LocalizedLink";
import { Home, MessageCircle, User, LogOut, Wrench, HardHat, Users, Settings, X } from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  communityId?: string;
  communityCounts?: { equipment: number; artisans: number; members: number };
  isAdmin?: boolean;
}

export function MobileDrawer({ isOpen, onClose, communityId, communityCounts, isAdmin }: MobileDrawerProps) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { user, logout } = useAuth();
  const navigate = useLocalizedNavigate();

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
      <div
        className={`fixed inset-0 bg-[var(--color-overlay)] z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-72 bg-[var(--color-card)] z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <span className="font-bold text-primary-600">{tc("nav.menu")}</span>
          <button onClick={onClose} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1 overflow-y-auto h-[calc(100%-4rem)]">
          {communityId && communityCounts && (
            <>
              <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider px-3 mb-1">{t("drawer.community_section")}</p>
              <DrawerLink to={`/app/communities/${communityId}/equipment`} icon={<Wrench className="w-5 h-5" strokeWidth={1.5} />} label={t("drawer.equipment")} badge={communityCounts.equipment} onClose={onClose} />
              <DrawerLink to={`/app/communities/${communityId}/artisans`} icon={<HardHat className="w-5 h-5" strokeWidth={1.5} />} label={t("drawer.artisans")} badge={communityCounts.artisans} onClose={onClose} />
              <DrawerLink to={`/app/communities/${communityId}/members`} icon={<Users className="w-5 h-5" strokeWidth={1.5} />} label={t("drawer.members")} badge={communityCounts.members} onClose={onClose} />
              {isAdmin && (
                <DrawerLink to={`/app/communities/${communityId}/admin`} icon={<Settings className="w-5 h-5" strokeWidth={1.5} />} label={t("drawer.administration")} onClose={onClose} />
              )}
              <div className="border-t border-[var(--color-border)] my-3" />
            </>
          )}

          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider px-3 mb-1">{t("drawer.nav_section")}</p>
          <DrawerLink to="/app" icon={<Home className="w-5 h-5" strokeWidth={1.5} />} label={tc("nav.communities")} onClose={onClose} />
          <DrawerLink to="/app/messages" icon={<MessageCircle className="w-5 h-5" strokeWidth={1.5} />} label={tc("nav.messages")} onClose={onClose} />
          <DrawerLink to="/app/profile" icon={<User className="w-5 h-5" strokeWidth={1.5} />} label={user?.firstName ?? tc("nav.communities")} onClose={onClose} />

          <div className="flex-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-[var(--radius-button)] bg-transparent border-none cursor-pointer w-full text-left"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            {t("drawer.disconnect")}
          </button>
        </nav>
      </div>
    </>
  );
}

function DrawerLink({ to, icon, label, badge, onClose }: { to: string; icon: React.ReactNode; label: string; badge?: number; onClose: () => void }) {
  return (
    <LocalizedLink
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] rounded-[var(--radius-button)] no-underline"
    >
      <span className="text-[var(--color-text-tertiary)]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="text-xs text-[var(--color-text-tertiary)]">{badge}</span>
      )}
    </LocalizedLink>
  );
}
