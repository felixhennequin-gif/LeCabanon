import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
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
  const { communityId } = useParams<{ communityId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  if (!community) return <div className="text-center py-12 text-[var(--color-text-secondary)]">Communauté introuvable</div>;

  const isAdmin = community.role === "ADMIN";
  const filtered = community.members.filter((m) => {
    if (!search) return true;
    const name = `${m.user.firstName} ${m.user.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  async function handleRemove(member: Member) {
    if (!confirm(`Retirer ${member.user.firstName} ${member.user.lastName} de la communauté ?`)) return;
    await api(`/communities/${communityId}/members/${member.userId}`, { method: "DELETE" });
    setCommunity((prev) => prev ? {
      ...prev,
      members: prev.members.filter((m) => m.userId !== member.userId),
      _count: { ...prev._count, members: prev._count.members - 1 },
    } : prev);
  }

  return (
    <div>
      <Link to={`/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Retour
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Membres — {community.name}</h1>
        <span className="text-sm text-[var(--color-text-tertiary)]">{community._count.members} membre{community._count.members > 1 ? "s" : ""}</span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full pl-10 pr-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
        />
      </div>

      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {filtered.map((m) => (
          <div key={m.userId} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Link
                to={`/users/${m.user.id}`}
                className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium no-underline shrink-0"
              >
                {m.user.firstName[0]}{m.user.lastName[0]}
              </Link>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  <Link to={`/users/${m.user.id}`} className="text-[var(--color-text-primary)] no-underline hover:underline">
                    {m.user.firstName} {m.user.lastName}
                  </Link>
                  {m.role === "ADMIN" && <span className="ml-1.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-[var(--radius-pill)]">Admin</span>}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Membre depuis {new Date(m.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
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
                    navigate(`/messages/${conv.id}`);
                  }}
                  className="text-[var(--color-text-tertiary)] hover:text-primary-600 bg-transparent border-none cursor-pointer p-1"
                  title="Envoyer un message"
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
          <p className="text-center py-8 text-sm text-[var(--color-text-tertiary)]">Aucun membre trouvé</p>
        )}
      </div>
    </div>
  );
}
