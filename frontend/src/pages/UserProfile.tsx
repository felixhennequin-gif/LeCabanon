import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { Package, ArrowLeft } from "lucide-react";

interface UserEquipment {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  photos: string[];
  community: { id: string; name: string };
}

interface UserReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  artisan: { id: string; name: string; company?: string | null };
}

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  createdAt: string;
  equipment: UserEquipment[];
  reviews: UserReview[];
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === user?.id) {
      navigate("/profile", { replace: true });
      return;
    }
    if (id) {
      api<UserProfileData>(`/users/${id}/profile`)
        .then(setProfile)
        .finally(() => setLoading(false));
    }
  }, [id, user?.id, navigate]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!profile) return <div className="text-center py-12 text-gray-500">Utilisateur introuvable</div>;

  // Group equipment by community
  const equipmentByCommunity = profile.equipment.reduce<Record<string, { name: string; id: string; items: UserEquipment[] }>>((acc, e) => {
    if (!acc[e.community.id]) acc[e.community.id] = { name: e.community.name, id: e.community.id, items: [] };
    acc[e.community.id].items.push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
            <p className="text-sm text-gray-400">
              Membre depuis {new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Equipment */}
      {profile.equipment.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Matériel à prêter</h2>
          {Object.values(equipmentByCommunity).map((group) => (
            <div key={group.id} className="mb-4">
              <Link to={`/communities/${group.id}`} className="text-sm text-gray-400 no-underline hover:underline mb-2 block">
                {group.name}
              </Link>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((e) => (
                  <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-28 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {e.photos[0] ? (
                        <img src={e.photos[0]} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900">{e.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded-full">{e.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      {profile.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Avis postés</h2>
          <div className="space-y-3">
            {profile.reviews.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <Link to={`/artisans/${r.artisan.id}`} className="font-medium text-primary-600 no-underline hover:underline text-sm">
                    {r.artisan.company || r.artisan.name}
                  </Link>
                  <StarRating rating={r.rating} size={14} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.equipment.length === 0 && profile.reviews.length === 0 && (
        <p className="text-center text-gray-400 py-8">Aucune activité visible</p>
      )}
    </div>
  );
}
