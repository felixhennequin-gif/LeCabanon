import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { StarRating } from "../components/StarRating";
import { LocalizedLink } from "../components/LocalizedLink";
import { Plus, ArrowLeft, HardHat, Phone, MapPin, Globe, BadgeCheck } from "lucide-react";

const ARTISAN_CATEGORIES = [
  "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
  "Paysagisme", "Couverture / Toiture", "Serrurerie", "Chauffage / Climatisation", "Nettoyage",
  "Architecture", "Maîtrise d'œuvre", "Carrelage / Revêtement de sol",
  "Couverture / Charpente / Isolation", "Enduit / Isolation extérieur / Peinture",
  "Maçonnerie / Rénovation / Couverture",
];

interface ArtisanItem {
  id: string;
  name: string;
  company?: string;
  category: string;
  zone?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdById: string;
  claimed: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export function ArtisanList() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { communityId } = useParams<{ communityId: string }>();
  const [artisans, setArtisans] = useState<ArtisanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadArtisans = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?category=${encodeURIComponent(filter)}` : "";
      const data = await api<ArtisanItem[]>(`/artisans/community/${communityId}${params}`);
      setArtisans(data);
    } finally {
      setLoading(false);
    }
  }, [communityId, filter]);

  useEffect(() => {
    loadArtisans();
  }, [loadArtisans]);

  return (
    <div>
      <LocalizedLink to={`/app/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </LocalizedLink>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t("artisans.title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.add")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1 text-sm rounded-[var(--radius-pill)] cursor-pointer border ${!filter ? "bg-primary-600 text-[var(--color-page)] border-primary-600" : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]"}`}
        >
          {t("artisans.all")}
        </button>
        {ARTISAN_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat === filter ? "" : cat)}
            className={`px-3 py-1 text-sm rounded-[var(--radius-pill)] cursor-pointer border ${filter === cat ? "bg-primary-600 text-[var(--color-page)] border-primary-600" : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : artisans.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-secondary)]">
          <HardHat className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
          <p className="text-lg font-medium">{filter ? t("artisans.empty_in_category", { category: filter }) : t("artisans.empty")}</p>
          <p className="text-sm mt-1">{t("artisans.empty_hint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {artisans.map((a) => (
            <LocalizedLink
              key={a.id}
              to={`/app/artisans/${a.id}`}
              className="bg-[var(--color-card)] p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-primary-400 hover:shadow-sm transition-all no-underline"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">
                    {a.name}
                    {a.claimed && <BadgeCheck className="inline w-3.5 h-3.5 text-[var(--color-success)] ml-1 -mt-0.5" strokeWidth={1.5} />}
                    {a.website && <Globe className="inline w-3.5 h-3.5 text-[var(--color-text-tertiary)] ml-1.5 -mt-0.5" strokeWidth={1.5} />}
                  </h3>
                  {a.company && <p className="text-sm text-[var(--color-text-secondary)]">{a.company}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)]">{a.category}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={a.avgRating ?? 0} size={16} />
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {t("artisans.review_count", { count: a.reviewCount })}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--color-text-secondary)]">
                {a.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{a.zone}</span>}
                {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" strokeWidth={1.5} />{a.phone}</span>}
              </div>
            </LocalizedLink>
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
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const [form, setForm] = useState({ name: "", company: "", category: ARTISAN_CATEGORIES[0], zone: "", phone: "", email: "", website: "" });
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
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t("artisans.form.title")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.name")}</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.company")}</label>
          <input value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.category")}</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]">
            {ARTISAN_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.zone")}</label>
          <input value={form.zone} onChange={(e) => update("zone", e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" placeholder={t("artisans.form.zone_placeholder")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.phone")}</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.email")}</label>
            <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("artisans.form.website")}</label>
          <input value={form.website} onChange={(e) => update("website", e.target.value)} type="url" className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]" placeholder={t("artisans.form.website_placeholder")} />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">{tc("actions.cancel")}</button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">{loading ? "..." : tc("actions.add")}</button>
        </div>
      </form>
    </div>
  );
}
