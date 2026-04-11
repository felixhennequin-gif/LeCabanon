import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { StarRating } from "../components/StarRating";
import { LinkPreview } from "../components/LinkPreview";
import { Avatar } from "../components/Avatar";
import { ArrowLeft, Phone, Mail, MapPin, Trash2, MessageCircle, BadgeCheck, ExternalLink, Award, Clock, Edit3, Plus, X } from "lucide-react";

interface ReviewReply {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

interface ReviewMedia {
  id: string;
  url: string;
  type: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  visibility: string;
  createdAt: string;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; photo?: string | null };
  media: ReviewMedia[];
  replies: ReviewReply[];
}

interface ArtisanCommunity {
  communityId: string;
  community: { id: string; name: string };
}

interface ArtisanData {
  id: string;
  name: string;
  company?: string;
  category: string;
  zone?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  certifications: string[];
  horaires?: string;
  ownPhotos: string[];
  claimed: boolean;
  ownerId?: string | null;
  createdById: string;
  avgRating: number | null;
  reviews: Review[];
  communities: ArtisanCommunity[];
  createdBy: { id: string; firstName: string; lastName: string };
}

export function ArtisanDetail() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  function reload() {
    if (id) api<ArtisanData>(`/artisans/${id}`).then(setArtisan);
  }

  useEffect(() => {
    if (id) {
      api<ArtisanData>(`/artisans/${id}`)
        .then(setArtisan)
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function handleDelete() {
    if (!artisan || !confirm(t("artisans.delete_confirm"))) return;
    await api(`/artisans/${artisan.id}`, { method: "DELETE" });
    navigate(-1);
  }

  async function handleClaim() {
    if (!artisan) return;
    setClaimLoading(true);
    try {
      const res = await api<{ message: string }>(`/artisans/${artisan.id}/claim`, { method: "POST" });
      setClaimMessage(res.message);
    } catch (err) {
      setClaimMessage(err instanceof Error ? err.message : tc("errors.generic"));
    } finally {
      setClaimLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!artisan) return <div className="text-center py-12 text-[var(--color-text-secondary)]">{t("artisans.not_found")}</div>;

  const isOwner = artisan.ownerId === user?.id;
  const firstCommunityId = artisan.communities[0]?.communityId;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </button>

      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{artisan.name}</h1>
              {artisan.claimed && (
                <span className="inline-flex items-center gap-1 text-xs text-accent-600 bg-accent-50 px-2 py-0.5 rounded-[var(--radius-pill)]">
                  <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> {t("artisans.verified")}
                </span>
              )}
            </div>
            {artisan.company && <p className="text-[var(--color-text-secondary)]">{artisan.company}</p>}
            <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)] mt-2">{artisan.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <LocalizedLink
              to={`/artisans/${artisan.id}/public`}
              className="text-[var(--color-text-tertiary)] hover:text-primary-600 no-underline"
              title={t("artisans.view_public_page")}
            >
              <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
            </LocalizedLink>
            {artisan.createdById === user?.id && (
              <button onClick={handleDelete} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-transparent border-none cursor-pointer">
                <Trash2 className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {artisan.communities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {artisan.communities.map((ac) => (
              <LocalizedLink
                key={ac.communityId}
                to={`/app/communities/${ac.communityId}`}
                className="text-xs px-2 py-0.5 bg-[var(--color-input)] text-[var(--color-text-secondary)] rounded-[var(--radius-pill)] no-underline hover:bg-[var(--color-hover)]"
              >
                {ac.community.name}
              </LocalizedLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <StarRating rating={artisan.avgRating ?? 0} size={20} />
          <span className="text-sm text-[var(--color-text-secondary)]">({t("artisans.review_count", { count: artisan.reviews.length })})</span>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--color-text-secondary)]">
          {artisan.zone && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />{artisan.zone}</span>}
          {artisan.phone && (
            <a href={`tel:${artisan.phone}`} className="flex items-center gap-1.5 text-primary-600 no-underline hover:underline">
              <Phone className="w-4 h-4" strokeWidth={1.5} />{artisan.phone}
            </a>
          )}
          {artisan.email && (
            <a href={`mailto:${artisan.email}`} className="flex items-center gap-1.5 text-primary-600 no-underline hover:underline">
              <Mail className="w-4 h-4" strokeWidth={1.5} />{artisan.email}
            </a>
          )}
        </div>

        {artisan.website && (
          <div className="mt-4">
            <LinkPreview url={artisan.website} />
          </div>
        )}

        {artisan.claimed && (artisan.description || artisan.certifications.length > 0 || artisan.horaires) && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
            {artisan.description && (
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{artisan.description}</p>
            )}
            {artisan.certifications.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Award className="w-4 h-4 text-accent-400" strokeWidth={1.5} />
                {artisan.certifications.map((c, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-accent-50 text-accent-600 rounded-[var(--radius-pill)]">{c}</span>
                ))}
              </div>
            )}
            {artisan.horaires && (
              <p className="text-sm text-[var(--color-text-secondary)] flex items-start gap-1.5">
                <Clock className="w-4 h-4 text-[var(--color-text-tertiary)] mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="whitespace-pre-line">{artisan.horaires}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {t("artisans.added_by")}{" "}
            <LocalizedLink to={`/app/users/${artisan.createdBy.id}`} className="text-[var(--color-text-secondary)] no-underline hover:underline">
              {artisan.createdBy.firstName} {artisan.createdBy.lastName}
            </LocalizedLink>
          </p>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setShowProfileEdit(true)}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("artisans.edit_profile")}
              </button>
            )}
            {artisan.createdById !== user?.id && firstCommunityId && (
              <button
                onClick={async () => {
                  const conv = await api<{ id: string }>("/conversations", {
                    method: "POST",
                    body: JSON.stringify({ recipientId: artisan.createdById, communityId: firstCommunityId }),
                  });
                  navigate(`/app/messages/${conv.id}`);
                }}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("artisans.contact")}
              </button>
            )}
          </div>
        </div>
      </div>

      {!artisan.claimed && artisan.email && (
        <div className="bg-accent-50 border border-accent-200 rounded-[var(--radius-card)] p-4 mb-6">
          <p className="text-sm text-accent-800 mb-2" dangerouslySetInnerHTML={{ __html: t("artisans.claim.prompt", { name: artisan.name }) }} />
          {claimMessage ? (
            <p className="text-sm text-accent-600">{claimMessage}</p>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claimLoading}
              className="px-4 py-1.5 text-sm bg-accent-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-accent-700 cursor-pointer disabled:opacity-50"
            >
              {claimLoading ? "..." : t("artisans.claim.button")}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t("reviews.title")}</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 cursor-pointer"
        >
          {t("reviews.leave_review")}
        </button>
      </div>

      {artisan.reviews.length === 0 ? (
        <p className="text-[var(--color-text-secondary)] text-center py-8">{t("reviews.no_reviews")}</p>
      ) : (
        <div className="space-y-4">
          {artisan.reviews.map((r) => (
            <div key={r.id} className="bg-[var(--color-card)] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LocalizedLink to={`/app/users/${r.author.id}`} className="no-underline shrink-0">
                    <Avatar src={r.author.photo} name={`${r.author.firstName} ${r.author.lastName}`} size="sm" />
                  </LocalizedLink>
                  <div>
                    <LocalizedLink to={`/app/users/${r.author.id}`} className="text-sm font-medium text-[var(--color-text-primary)] no-underline hover:underline">{r.author.firstName} {r.author.lastName}</LocalizedLink>
                    <StarRating rating={r.rating} size={14} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {r.visibility === "COMMUNITY" && (
                    <span className="block text-xs text-accent-600 mt-0.5">{t("reviews.visibility_badge")}</span>
                  )}
                </div>
              </div>
              {r.comment && <p className="text-sm text-[var(--color-text-secondary)] mt-3">{r.comment}</p>}

              {r.media && r.media.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {r.media.map((m) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer">
                      <img src={m.url} alt="" className="w-20 h-20 rounded-[var(--radius-input)] object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {r.replies.length > 0 && (
                <div className="mt-3 bg-primary-50 rounded-[var(--radius-input)] p-3 border-l-2 border-primary-400">
                  <p className="text-xs font-semibold text-primary-700 mb-1">{t("reviews.artisan_reply")}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{r.replies[0].content}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {new Date(r.replies[0].createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}

              {isOwner && r.replies.length === 0 && (
                <>
                  {replyingTo === r.id ? (
                    <ReplyForm
                      reviewId={r.id}
                      onClose={() => setReplyingTo(null)}
                      onCreated={() => { setReplyingTo(null); reload(); }}
                    />
                  ) : (
                    <button
                      onClick={() => setReplyingTo(r.id)}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer"
                    >
                      {tc("actions.reply")}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          artisanId={artisan.id}
          communityId={firstCommunityId ?? ""}
          onClose={() => setShowReviewForm(false)}
          onCreated={() => {
            reload();
            setShowReviewForm(false);
          }}
        />
      )}

      {showProfileEdit && (
        <ProfileEditForm
          artisan={artisan}
          onClose={() => setShowProfileEdit(false)}
          onSaved={() => { reload(); setShowProfileEdit(false); }}
        />
      )}
    </div>
  );
}

function ReplyForm({ reviewId, onClose, onCreated }: { reviewId: string; onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api(`/artisans/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
        rows={3}
        placeholder={t("reviews.reply_placeholder")}
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">{tc("actions.cancel")}</button>
        <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">{loading ? "..." : tc("actions.reply")}</button>
      </div>
    </form>
  );
}

function ReviewForm({ artisanId, communityId, onClose, onCreated }: { artisanId: string; communityId: string; onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "COMMUNITY">("PUBLIC");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 3 - photoFiles.length);
    setPhotoFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(t("reviews.rating_required")); return; }
    setLoading(true);
    try {
      const review = await api<{ id: string }>(`/artisans/${artisanId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, visibility, communityId }),
      });

      if (photoFiles.length > 0) {
        const formData = new FormData();
        for (const file of photoFiles) {
          formData.append("photos", file);
        }
        await api(`/artisans/reviews/${review.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold">{t("reviews.leave_review")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t("reviews.rating_label")}</label>
          <StarRating rating={rating} onChange={setRating} size={28} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("reviews.comment_label")}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            rows={4}
            placeholder={t("reviews.comment_placeholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t("photos.add")}</label>
          {photoFiles.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {photoFiles.map((file, i) => (
                <div key={i} className="relative group">
                  <img src={URL.createObjectURL(file)} alt="" className="w-16 h-16 rounded-[var(--radius-input)] object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-error)] text-[var(--color-page)] rounded-full flex items-center justify-center cursor-pointer border-none"
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photoFiles.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer p-0"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("photos.add")}
            </button>
          )}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{t("photos.max_reviews")} — {t("photos.formats")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={visibility === "COMMUNITY"}
              onChange={(e) => setVisibility(e.target.checked ? "COMMUNITY" : "PUBLIC")}
              className="accent-primary-600"
            />
            {t("reviews.visibility_community")}
          </label>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1 ml-6">
            {visibility === "PUBLIC" ? t("reviews.visibility_public_hint") : t("reviews.visibility_community_hint")}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">{tc("actions.cancel")}</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">{loading ? "..." : tc("actions.publish")}</button>
        </div>
      </form>
    </div>
  );
}

function ProfileEditForm({ artisan, onClose, onSaved }: { artisan: ArtisanData; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const [description, setDescription] = useState(artisan.description ?? "");
  const [certifications, setCertifications] = useState(artisan.certifications.join(", "));
  const [horaires, setHoraires] = useState(artisan.horaires ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/artisans/${artisan.id}/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          description: description || undefined,
          certifications: certifications ? certifications.split(",").map((c) => c.trim()).filter(Boolean) : [],
          horaires: horaires || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold">{t("artisans.profile_edit.title")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.profile_edit.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            rows={4}
            placeholder={t("artisans.profile_edit.description_placeholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.profile_edit.certifications")}</label>
          <input
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            placeholder={t("artisans.profile_edit.certifications_placeholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.profile_edit.hours")}</label>
          <textarea
            value={horaires}
            onChange={(e) => setHoraires(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            rows={3}
            placeholder={t("artisans.profile_edit.hours_placeholder")}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">{tc("actions.cancel")}</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">{loading ? "..." : tc("actions.save")}</button>
        </div>
      </form>
    </div>
  );
}
