import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { StarRating } from "../components/StarRating";
import { ArrowLeft, Phone, Mail, MapPin, Trash2 } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  visibility: string;
  createdAt: string;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; photo?: string | null };
}

interface ArtisanData {
  id: string;
  name: string;
  company?: string;
  category: string;
  zone?: string;
  phone?: string;
  email?: string;
  createdById: string;
  communityId: string;
  avgRating: number | null;
  reviews: Review[];
  createdBy: { id: string; firstName: string; lastName: string };
}

export function ArtisanDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (id) {
      api<ArtisanData>(`/artisans/${id}`)
        .then(setArtisan)
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function handleDelete() {
    if (!artisan || !confirm("Supprimer cet artisan ?")) return;
    await api(`/artisans/${artisan.id}`, { method: "DELETE" });
    navigate(`/communities/${artisan.communityId}/artisans`);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!artisan) return <div className="text-center py-12 text-gray-500">Artisan introuvable</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{artisan.name}</h1>
            {artisan.company && <p className="text-gray-500">{artisan.company}</p>}
            <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full mt-2">{artisan.category}</span>
          </div>
          {artisan.createdById === user?.id && (
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <StarRating rating={artisan.avgRating ?? 0} size={20} />
          <span className="text-sm text-gray-500">({artisan.reviews.length} avis)</span>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
          {artisan.zone && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />{artisan.zone}</span>}
          {artisan.phone && (
            <a href={`tel:${artisan.phone}`} className="flex items-center gap-1.5 text-primary-600 no-underline hover:underline">
              <Phone className="w-4 h-4" />{artisan.phone}
            </a>
          )}
          {artisan.email && (
            <a href={`mailto:${artisan.email}`} className="flex items-center gap-1.5 text-primary-600 no-underline hover:underline">
              <Mail className="w-4 h-4" />{artisan.email}
            </a>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Ajouté par{" "}
          <Link to={`/users/${artisan.createdBy.id}`} className="text-gray-500 no-underline hover:underline">
            {artisan.createdBy.firstName} {artisan.createdBy.lastName}
          </Link>
        </p>
      </div>

      {/* Reviews */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Avis</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
        >
          Laisser un avis
        </button>
      </div>

      {artisan.reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucun avis pour le moment</p>
      ) : (
        <div className="space-y-4">
          {artisan.reviews.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link to={`/users/${r.author.id}`} className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium no-underline">
                    {r.author.firstName[0]}{r.author.lastName[0]}
                  </Link>
                  <div>
                    <Link to={`/users/${r.author.id}`} className="text-sm font-medium text-gray-900 no-underline hover:underline">{r.author.firstName} {r.author.lastName}</Link>
                    <StarRating rating={r.rating} size={14} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {r.visibility === "PRIVATE" && (
                    <span className="block text-xs text-warm-600 mt-0.5">Privé</span>
                  )}
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-3">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {showReviewForm && (
        <ReviewForm
          artisanId={artisan.id}
          onClose={() => setShowReviewForm(false)}
          onCreated={() => {
            api<ArtisanData>(`/artisans/${id}`).then(setArtisan);
            setShowReviewForm(false);
          }}
        />
      )}
    </div>
  );
}

function ReviewForm({ artisanId, onClose, onCreated }: { artisanId: string; onClose: () => void; onCreated: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Veuillez donner une note"); return; }
    setLoading(true);
    try {
      await api(`/artisans/${artisanId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, visibility }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-bold">Laisser un avis</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
          <StarRating rating={rating} onChange={setRating} size={28} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
            placeholder="Travail soigné, ponctuel, je recommande..."
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={visibility === "PRIVATE"}
              onChange={(e) => setVisibility(e.target.checked ? "PRIVATE" : "PUBLIC")}
              className="accent-primary-600"
            />
            Avis privé (visible uniquement par vous)
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg cursor-pointer">Annuler</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 cursor-pointer">{loading ? "..." : "Publier"}</button>
        </div>
      </form>
    </div>
  );
}
