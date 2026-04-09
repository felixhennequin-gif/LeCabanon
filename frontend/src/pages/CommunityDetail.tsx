import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { FeedList } from "../components/FeedList";
import { Wrench, HardHat, Users, Settings } from "lucide-react";

interface CommunityData {
  id: string;
  name: string;
  description?: string;
  role: string;
  _count: { members: number; equipment: number; artisans: number };
}

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);

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

      {/* Navigation cards */}
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

        <Link
          to={`/communities/${id}/members`}
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all no-underline text-center"
        >
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Membres</h3>
          <p className="text-2xl font-bold text-primary-600 mt-1">{community._count.members}</p>
          <p className="text-xs text-gray-400">voisins</p>
        </Link>
      </div>

      {/* Feed */}
      <FeedList communityId={id!} />
    </div>
  );
}
