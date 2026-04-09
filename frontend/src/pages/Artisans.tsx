import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { StarRating } from "../components/StarRating";
import { Plus, ArrowLeft, HardHat, Phone, MapPin } from "lucide-react";

const ARTISAN_CATEGORIES = [
  "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
  "Paysagisme", "Couverture / Toiture", "Serrurerie", "Chauffage / Climatisation", "Nettoyage",
];

interface ArtisanItem {
  id: string;
  name: string;
  company?: string;
  category: string;
  zone?: string;
  phone?: string;
  email?: string;
  createdById: string;
  avgRating: number | null;
  reviewCount: number;
}

export function ArtisanList() {
  const { communityId } = useParams<{ communityId: string }>();
  const [artisans, setArtisans] = useState<ArtisanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadArtisans();
  }, [communityId, filter]);

  async function loadArtisans() {
    setLoading(true);
    try {
      const params = filter ? `?category=${encodeURIComponent(filter)}` : "";
      const data = await api<ArtisanItem[]>(`/artisans/community/${communityId}${params}`);
      setArtisans(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link to={`/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Artisans recommandés</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1 text-sm rounded-full cursor-pointer border ${!filter ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          Tout
        </button>
        {ARTISAN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat === filter ? "" : cat)}
            className={`px-3 py-1 text-sm rounded-full cursor-pointer border ${filter === cat ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : artisans.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <HardHat className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucun artisan{filter ? ` en "${filter}"` : ""}</p>
          <p className="text-sm mt-1">Recommandez un artisan à vos voisins !</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {artisans.map((a) => (
            <Link
              key={a.id}
              to={`/artisans/${a.id}`}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all no-underline"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.name}</h3>
                  {a.company && <p className="text-sm text-gray-500">{a.company}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">{a.category}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={a.avgRating ?? 0} size={16} />
                <span className="text-xs text-gray-400">
                  {a.reviewCount} avis
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                {a.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.zone}</span>}
                {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <ArtisanForm communityId={communityId!} onClose={() => setShowForm(false)} onCreated={loadArtisans} />
      )}
    </div>
  );
}

function ArtisanForm({ communityId, onClose, onCreated }: { communityId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", company: "", category: ARTISAN_CATEGORIES[0], zone: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/artisans/community/${communityId}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onCreated();
      onClose();
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
        className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold">Recommander un artisan</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (optionnel)</label>
          <input value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            {ARTISAN_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone (optionnel)</label>
          <input value={form.zone} onChange={(e) => update("zone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" placeholder="Maisons-Laffitte et environs" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg cursor-pointer">Annuler</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 cursor-pointer">{loading ? "..." : "Ajouter"}</button>
        </div>
      </form>
    </div>
  );
}
