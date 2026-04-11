import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { ArrowLeft, Search, Trash2, MessageCircle } from "lucide-react";

interface Member {
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; photo?: string | null };
}

interface CommunityData {
  id: string;
  name: string;
  role: string;
  members: Member[];
  _count: { members: number };
}

export function Members() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { communityId } = useParams<{ communityId: string }>();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (communityId) {
      api<CommunityData>(`/communities/${communityId}`)
        .then(setCommunity)
        .finally(() => setLoading(false));
    }
  }, [communityId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!community) return <div className="text-center py-12 text-[var(--color-text-secondary)]">{t("community_detail.not_found")}</div>;

  const isAdmin = community.role === "ADMIN";
  const filtered = community.members.filter((m) => {
    if (!search) return true;
    const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function handleRemove(member: Member) {
    if (!confirm(t("members.remove_confirm", { name: `${member.user.firstName} ${member.user.lastName}` }))) return;
    await api(`/communities/${communityId}/members/${member.userId}`, { method: "DELETE" });
    setCommunity((prev) => prev ? {
      ...prev,
      members: prev.members.filter((m) => m.userId !== member.userId),
      _count: { ...prev._count, members: prev._count.members - 1 },
    } : prev);
  }

  return (
    <div>
      <LocalizedLink to={`/app/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </LocalizedLink>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t("members.title", { name: community.name })}</h1>
        <span className="text-sm text-[var(--color-text-tertiary)]">
          {community._count.members > 1 ? t("communities.member_count_plural", { count: community._count.members }) : t("communities.member_count", { count: community._count.members })}
        </span>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("members.search_placeholder")}
          className="w-full pl-10 pr-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
        />
      </div>

      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {filtered.map((m) => (
          <div key={m.userId} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <LocalizedLink
                to={`/app/users/${m.user.id}`}
                className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium no-underline shrink-0"
              >
                {m.user.firstName[0]}{m.user.lastName[0]}
              </LocalizedLink>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  <LocalizedLink to={`/app/users/${m.user.id}`} className="text-[var(--color-text-primary)] no-underline hover:underline">
                    {m.user.firstName} {m.user.lastName}
                  </LocalizedLink>
                  {m.role === "ADMIN" && <span className="ml-1.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-[var(--radius-pill)]">{tc("roles.admin")}</span>}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {t("members.member_since", { date: new Date(m.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {m.userId !== user?.id && (
                <button
                  onClick={async () => {
                    const conv = await api<{ id: string }>("/conversations", {
                      method: "POST",
                      body: JSON.stringify({ recipientId: m.userId, communityId }),
                    });
                    navigate(`/app/messages/${conv.id}`);
                  }}
                  className="text-[var(--color-text-tertiary)] hover:text-primary-600 bg-transparent border-none cursor-pointer p-1"
                  title={t("messages.send_message_title")}
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              {isAdmin && m.userId !== user?.id && (
                <button
                  onClick={() => handleRemove(m)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-transparent border-none cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">{t("members.no_members")}</p>
        )}
      </div>
    </div>
  );
}
