import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { StarRating } from "../components/StarRating";
import { Avatar } from "../components/Avatar";
import { Package, ArrowLeft } from "lucide-react";

interface UserEquipment {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  photos: { id: string; url: string }[];
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
  bio?: string | null;
  createdAt: string;
  equipment: UserEquipment[];
  reviews: UserReview[];
}

export function UserProfile() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === user?.id) {
      navigate("/app/profile", { replace: true });
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

  if (!profile) return <div className="text-center py-12 text-[var(--color-text-secondary)]">{t("user_profile.not_found")}</div>;

  const equipmentByCommunity = profile.equipment.reduce<Record<string, { name: string; id: string; items: UserEquipment[] }>>((acc, e) => {
    if (!acc[e.community.id]) acc[e.community.id] = { name: e.community.name, id: e.community.id, items: [] };
    acc[e.community.id].items.push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </button>

      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-center gap-4">
          <Avatar src={profile.photo} name={`${profile.firstName} ${profile.lastName}`} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{profile.firstName} {profile.lastName}</h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t("user_profile.member_since", { date: new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) })}
            </p>
          </div>
        </div>
        {profile.bio && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-4 whitespace-pre-line">{profile.bio}</p>
        )}
      </div>

      {profile.equipment.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">{t("user_profile.equipment_title")}</h2>
          {Object.values(equipmentByCommunity).map((group) => (
            <div key={group.id} className="mb-4">
              <LocalizedLink to={`/app/communities/${group.id}`} className="text-sm text-[var(--color-text-tertiary)] no-underline hover:underline mb-2 block">
                {group.name}
              </LocalizedLink>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((e) => (
                  <div key={e.id} className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
                    <div className="h-28 bg-[var(--color-input)] flex items-center justify-center">
                      {e.photos[0]?.url ? (
                        <img src={e.photos[0].url} alt={e.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-[var(--color-text-primary)]">{e.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)]">{e.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {profile.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">{t("user_profile.reviews_title")}</h2>
          <div className="space-y-3">
            {profile.reviews.map((r) => (
              <div key={r.id} className="bg-[var(--color-card)] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <LocalizedLink to={`/app/artisans/${r.artisan.id}`} className="font-medium text-primary-600 no-underline hover:underline text-sm">
                    {r.artisan.company || r.artisan.name}
                  </LocalizedLink>
                  <StarRating rating={r.rating} size={14} />
                </div>
                {r.comment && <p className="text-sm text-[var(--color-text-secondary)] mt-2">{r.comment}</p>}
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.equipment.length === 0 && profile.reviews.length === 0 && (
        <p className="text-center text-[var(--color-text-tertiary)] py-8">{t("user_profile.no_activity")}</p>
      )}
    </div>
  );
}
