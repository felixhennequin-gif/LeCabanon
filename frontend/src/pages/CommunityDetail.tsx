import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { FeedList } from "../components/FeedList";
import { Wrench, HardHat, Users, Settings, Trash2 } from "lucide-react";

interface Member {
  userId: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; email: string; photo?: string | null };
}

interface CommunityData {
  id: string;
  name: string;
  description?: string;
  accessCode: string;
  role: string;
  members: Member[];
  _count: { members: number; equipment: number; artisans: number };
}

type Tab = "feed" | "members";

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");

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

  if (!community) return <div className="text-center py-12 text-gray-500">Communauté introuvable</div>;

  const isAdmin = community.role === "ADMIN";

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{community.name}</h1>
          {community.description && <p className="text-gray-500 mt-1">{community.description}</p>}
        </div>
        {isAdmin && (
          <Link
            to={`/communities/${id}/admin`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 no-underline bg-white"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Link>
        )}
      </div>

      {/* Hub cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Link
          to={`/communities/${id}/equipment`}
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all no-underline text-center"
        >
          <Wrench className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Matériel</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.equipment}</p>
          <p className="text-xs text-gray-400">objets à prêter</p>
        </Link>

        <Link
          to={`/communities/${id}/artisans`}
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all no-underline text-center"
        >
          <HardHat className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Artisans</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.artisans}</p>
          <p className="text-xs text-gray-400">artisans recommandés</p>
        </Link>

        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Membres</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.members}</p>
          <p className="text-xs text-gray-400">voisins</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab("feed")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer bg-transparent ${
            tab === "feed" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setTab("members")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px cursor-pointer bg-transparent ${
            tab === "members" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Membres ({community._count.members})
        </button>
      </div>

      {tab === "feed" && <FeedList communityId={id!} />}

      {tab === "members" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="space-y-3">
            {community.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/users/${m.user.id}`}
                    className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium no-underline"
                  >
                    {m.user.firstName[0]}{m.user.lastName[0]}
                  </Link>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      <Link to={`/users/${m.user.id}`} className="text-gray-900 no-underline hover:underline">
                        {m.user.firstName} {m.user.lastName}
                      </Link>
                      {m.role === "ADMIN" && <span className="ml-1.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Admin</span>}
                    </p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>
                {isAdmin && m.userId !== user?.id && (
                  <button
                    onClick={async () => {
                      if (confirm(`Retirer ${m.user.firstName} ${m.user.lastName} ?`)) {
                        await api(`/communities/${id}/members/${m.userId}`, { method: "DELETE" });
                        setCommunity((prev) => prev ? {
                          ...prev,
                          members: prev.members.filter((x) => x.userId !== m.userId),
                          _count: { ...prev._count, members: prev._count.members - 1 },
                        } : prev);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
