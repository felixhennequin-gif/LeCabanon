import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { FeedList } from "../components/FeedList";
import { MobileDrawer } from "../components/MobileDrawer";
import { LocalizedLink } from "../components/LocalizedLink";
import { Wrench, HardHat, Users, Settings, Menu } from "lucide-react";

interface CommunityData {
  id: string;
  name: string;
  description?: string;
  role: string;
  _count: { members: number; equipment: number; artisans: number };
}

export function CommunityDetail() {
  const { t } = useTranslation("app");
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (id) {
      api<CommunityData>(`/communities/${id}`)
        .then(setCommunity)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!community) return <div className="text-center py-12 text-[var(--color-text-secondary)]">{t("community_detail.not_found")}</div>;

  const isAdmin = community.role === "ADMIN";

  return (
    <div>
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{community.name}</h1>
          {community.description && <p className="text-[var(--color-text-secondary)] mt-1 hidden sm:block">{community.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 sm:hidden text-xs text-[var(--color-text-tertiary)]">
            <span>{community._count.equipment} {t("community_detail.equipment_label")}</span>
            <span>{community._count.artisans} {t("community_detail.artisans_label")}</span>
            <span>{community._count.members} {t("community_detail.members_label")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <LocalizedLink
              to={`/app/communities/${id}/admin`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] hover:bg-[var(--color-hover)] no-underline bg-[var(--color-card)]"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
              {t("drawer.administration")}
            </LocalizedLink>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="hidden sm:grid gap-4 sm:grid-cols-3 mb-8">
        <LocalizedLink
          to={`/app/communities/${id}/equipment`}
          className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-primary-400 hover:shadow-sm transition-all no-underline text-center"
        >
          <Wrench className="w-8 h-8 text-primary-600 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="font-semibold text-[var(--color-text-primary)]">{t("community_detail.equipment_card.title")}</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.equipment}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{t("community_detail.equipment_card.subtitle")}</p>
        </LocalizedLink>

        <LocalizedLink
          to={`/app/communities/${id}/artisans`}
          className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-primary-400 hover:shadow-sm transition-all no-underline text-center"
        >
          <HardHat className="w-8 h-8 text-primary-600 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="font-semibold text-[var(--color-text-primary)]">{t("community_detail.artisans_card.title")}</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.artisans}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{t("community_detail.artisans_card.subtitle")}</p>
        </LocalizedLink>

        <LocalizedLink
          to={`/app/communities/${id}/members`}
          className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-primary-400 hover:shadow-sm transition-all no-underline text-center"
        >
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="font-semibold text-[var(--color-text-primary)]">{t("community_detail.members_card.title")}</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.members}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{t("community_detail.members_card.subtitle")}</p>
        </LocalizedLink>
      </div>

      <FeedList communityId={id!} />

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        communityId={id}
        communityCounts={community._count}
        isAdmin={isAdmin}
      />
    </div>
  );
}
