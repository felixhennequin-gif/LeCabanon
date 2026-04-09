import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { AccessCodeBadge } from "./Communities";
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

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

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
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">Code d'accès :</span>
            <AccessCodeBadge code={community.accessCode} />
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer bg-white"
          >
            <Settings className="w-4 h-4" />
            Admin
          </button>
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

      {/* Members list (always visible) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">Membres</h2>
        <div className="space-y-3">
          {community.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                  {m.user.firstName[0]}{m.user.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {m.user.firstName} {m.user.lastName}
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
    </div>
  );
}
