import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { StarRating } from "../components/StarRating";
import { LinkPreview } from "../components/LinkPreview";
import { MapPin, BadgeCheck, Clock, Share2, Award, Phone, UserCheck } from "lucide-react";

interface ReviewReply {
  id: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

interface PublicReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
  media: { id: string; url: string; type: string }[];
  replies: ReviewReply[];
}

interface PublicArtisan {
  id: string;
  name: string;
  company?: string;
  category: string;
  zone?: string;
  phone?: string;
  website?: string;
  description?: string;
  certifications: string[];
  horaires?: string;
  ownPhotos: string[];
  claimed: boolean;
  avgRating: number | null;
  totalReviews: number;
  reviews: PublicReview[];
}

export function ArtisanPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [artisan, setArtisan] = useState<PublicArtisan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/artisans/${id}/public`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Artisan introuvable");
        return res.json();
      })
      .then(setArtisan)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{error || "Artisan introuvable"}</p>
      </div>
    );
  }

  // Collect all photos: artisan's own + review media
  const allPhotos = [
    ...artisan.ownPhotos,
    ...artisan.reviews.flatMap((r) => r.media.filter((m) => m.type === "IMAGE").map((m) => m.url)),
  ];

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `${artisan!.name} — LeCabanon`,
        text: `Découvrez ${artisan!.name}${artisan!.company ? ` (${artisan!.company})` : ""} sur LeCabanon`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{artisan.name}</h1>
                {artisan.claimed && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" /> Profil vérifié
                  </span>
                )}
              </div>
              {artisan.company && <p className="text-gray-500 dark:text-gray-400 mt-1">{artisan.company}</p>}
              <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full mt-2">
                {artisan.category}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="text-gray-400 hover:text-primary-600 bg-transparent border-none cursor-pointer p-2"
              title="Partager"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Contact & location info */}
          {(artisan.zone || artisan.phone) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
              {artisan.zone && (
                <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 text-gray-400" /> {artisan.zone}
                </p>
              )}
              {artisan.phone && (
                <a href={`tel:${artisan.phone}`} className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 no-underline hover:underline">
                  <Phone className="w-4 h-4" /> {artisan.phone}
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <StarRating rating={artisan.avgRating ?? 0} size={20} />
            <span className="text-sm text-gray-500 dark:text-gray-400">({artisan.totalReviews} avis)</span>
          </div>

          {artisan.website && (
            <div className="mt-4">
              <LinkPreview url={artisan.website} />
            </div>
          )}
        </div>

        {/* Claim CTA */}
        {!artisan.claimed && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Vous êtes <strong>{artisan.name}</strong> ? Revendiquez cette fiche pour enrichir votre profil et répondre aux avis.
              </p>
              <Link
                to={`/login?redirect=/artisans/${id}`}
                className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
              >
                Revendiquer cette fiche →
              </Link>
            </div>
          </div>
        )}

        {/* Profile info (if claimed) */}
        {artisan.claimed && (artisan.description || artisan.certifications.length > 0 || artisan.horaires) && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 space-y-4">
            {artisan.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">À propos</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{artisan.description}</p>
              </div>
            )}
            {artisan.certifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Award className="w-4 h-4" /> Certifications
                </h2>
                <div className="flex flex-wrap gap-2">
                  {artisan.certifications.map((cert, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {artisan.horaires && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Horaires
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{artisan.horaires}</p>
              </div>
            )}
          </div>
        )}

        {/* Photo gallery */}
        {allPhotos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Avis publics</h2>
        </div>

        {artisan.reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun avis public pour le moment</p>
        ) : (
          <div className="space-y-4">
            {artisan.reviews.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                      {r.author.firstName[0]}{r.author.lastName[0]}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {r.author.firstName} {r.author.lastName[0]}.
                      </span>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{r.comment}</p>}
                {r.media.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {r.media.filter((m) => m.type === "IMAGE").map((m) => (
                      <img key={m.id} src={m.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                {/* Reply */}
                {r.replies.length > 0 && (
                  <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border-l-2 border-primary-300 dark:border-primary-600">
                    <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
                      Réponse de l'artisan
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{r.replies[0].content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.replies[0].createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Rejoignez une communauté pour contacter {artisan.name} et voir tous les avis
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 no-underline"
          >
            Créer un compte
          </a>
        </div>
      </div>
    </div>
  );
}
