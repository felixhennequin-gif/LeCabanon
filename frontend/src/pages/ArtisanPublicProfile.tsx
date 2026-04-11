import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StarRating } from "../components/StarRating";
import { LinkPreview } from "../components/LinkPreview";
import { LocalizedLink } from "../components/LocalizedLink";
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
  const { t } = useTranslation("app");
  const { id } = useParams<{ id: string }>();
  const [artisan, setArtisan] = useState<PublicArtisan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/artisans/${id}/public`)
      .then(async (res) => {
        if (!res.ok) throw new Error(t("artisans.not_found"));
        return res.json();
      })
      .then(setArtisan)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-page)] flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="min-h-screen bg-[var(--color-page)] flex items-center justify-center">
        <p className="text-[var(--color-text-secondary)]">{error || t("artisans.not_found")}</p>
      </div>
    );
  }

  const allPhotos = [
    ...artisan.ownPhotos,
    ...artisan.reviews.flatMap((r) => r.media.filter((m) => m.type === "IMAGE").map((m) => m.url)),
  ];

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `${artisan!.name} — LeCabanon`,
        text: t("public_profile.share_text", { name: artisan!.name, company: artisan!.company ? ` (${artisan!.company})` : "" }),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{artisan.name}</h1>
                {artisan.claimed && (
                  <span className="inline-flex items-center gap-1 text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-[var(--radius-pill)]">
                    <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("artisans.verified_profile")}
                  </span>
                )}
              </div>
              {artisan.company && <p className="text-[var(--color-text-secondary)] mt-1">{artisan.company}</p>}
              <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)] mt-2">
                {artisan.category}
              </span>
            </div>
            <button
              onClick={handleShare}
              className="text-[var(--color-text-tertiary)] hover:text-primary-600 bg-transparent border-none cursor-pointer p-2"
              title={t("public_profile.share_text", { name: "", company: "" })}
            >
              <Share2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {(artisan.zone || artisan.phone) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
              {artisan.zone && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                  <MapPin className="w-4 h-4 text-[var(--color-text-tertiary)]" strokeWidth={1.5} /> {artisan.zone}
                </p>
              )}
              {artisan.phone && (
                <a href={`tel:${artisan.phone}`} className="flex items-center gap-1.5 text-sm text-primary-600 no-underline hover:underline">
                  <Phone className="w-4 h-4" strokeWidth={1.5} /> {artisan.phone}
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <StarRating rating={artisan.avgRating ?? 0} size={20} />
            <span className="text-sm text-[var(--color-text-secondary)]">({t("artisans.review_count", { count: artisan.totalReviews })})</span>
          </div>

          {artisan.website && (
            <div className="mt-4">
              <LinkPreview url={artisan.website} />
            </div>
          )}
        </div>

        {!artisan.claimed && (
          <div className="bg-accent-50 border border-accent-200 rounded-[var(--radius-card)] p-4 mb-6 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-accent-600 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm text-accent-800" dangerouslySetInnerHTML={{ __html: t("artisans.claim.prompt_public", { name: artisan.name }) }} />
              <LocalizedLink
                to={`/login?redirect=/artisans/${id}`}
                className="text-sm font-medium text-accent-600 hover:underline"
              >
                {t("artisans.claim.link")}
              </LocalizedLink>
            </div>
          </div>
        )}

        {artisan.claimed && (artisan.description || artisan.certifications.length > 0 || artisan.horaires) && (
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6 space-y-4">
            {artisan.description && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">{t("public_profile.about")}</h2>
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{artisan.description}</p>
              </div>
            )}
            {artisan.certifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1">
                  <Award className="w-4 h-4" strokeWidth={1.5} /> {t("public_profile.certifications")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {artisan.certifications.map((cert, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-accent-50 text-accent-600 rounded-[var(--radius-pill)]">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {artisan.horaires && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" strokeWidth={1.5} /> {t("public_profile.hours")}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{artisan.horaires}</p>
              </div>
            )}
          </div>
        )}

        {allPhotos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">{t("public_profile.photos")}</h2>
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-[var(--radius-button)] overflow-hidden bg-[var(--color-input)]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("reviews.public_title")}</h2>
        </div>

        {artisan.reviews.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-center py-8">{t("reviews.no_public_reviews")}</p>
        ) : (
          <div className="space-y-4">
            {artisan.reviews.map((r) => (
              <div key={r.id} className="bg-[var(--color-card)] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                      {r.author.firstName[0]}{r.author.lastName[0]}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {r.author.firstName} {r.author.lastName[0]}.
                      </span>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-[var(--color-text-secondary)] mt-3">{r.comment}</p>}
                {r.media.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {r.media.filter((m) => m.type === "IMAGE").map((m) => (
                      <img key={m.id} src={m.url} alt="" className="w-16 h-16 rounded-[var(--radius-input)] object-cover" />
                    ))}
                  </div>
                )}
                {r.replies.length > 0 && (
                  <div className="mt-3 bg-primary-50 rounded-[var(--radius-input)] p-3 border-l-2 border-primary-400">
                    <p className="text-xs font-semibold text-primary-700 mb-1">
                      {t("reviews.artisan_reply")}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{r.replies[0].content}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {new Date(r.replies[0].createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            {t("public_profile.join_cta", { name: artisan.name })}
          </p>
          <LocalizedLink
            to="/register"
            className="inline-block px-6 py-2.5 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] text-sm font-medium hover:bg-primary-700 no-underline"
          >
            {t("public_profile.create_account")}
          </LocalizedLink>
        </div>
      </div>
    </div>
  );
}
