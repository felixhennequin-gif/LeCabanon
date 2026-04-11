import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { LocalizedLink } from "../components/LocalizedLink";
import { Plus, ArrowLeft, Package, User } from "lucide-react";

const EQUIPMENT_CATEGORIES = [
  "Jardinage", "Bricolage", "Nettoyage", "Electroportatif",
  "Echelles & echafaudages", "Automobile", "Demenagement", "Cuisine / Reception",
];

interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  photos: string[];
  ownerId: string;
  owner: { id: string; firstName: string; lastName: string; photo?: string | null };
  createdAt: string;
}

interface OwnerInfo {
  id: string;
  firstName: string;
  lastName: string;
}

interface EquipmentListResponse {
  equipment: EquipmentItem[];
  owners: OwnerInfo[];
}

export function EquipmentList() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { communityId } = useParams<{ communityId: string }>();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [owners, setOwners] = useState<OwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("category", filter);
      if (ownerFilter) params.set("ownerId", ownerFilter);
      const qs = params.toString() ? `?${params}` : "";
      const data = await api<EquipmentListResponse>(`/equipment/community/${communityId}${qs}`);
      setEquipment(data.equipment);
      setOwners(data.owners);
    } finally {
      setLoading(false);
    }
  }, [communityId, filter, ownerFilter]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  return (
    <div>
      <LocalizedLink to={`/app/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </LocalizedLink>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t("equipment.title")}</h1>
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
          {t("equipment.all")}
        </button>
        {EQUIPMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat === filter ? "" : cat)}
            className={`px-3 py-1 text-sm rounded-[var(--radius-pill)] cursor-pointer border ${filter === cat ? "bg-primary-600 text-[var(--color-page)] border-primary-600" : "bg-[var(--color-card)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {owners.length > 1 && (
        <div className="flex items-center gap-2 mb-6">
          <User className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" strokeWidth={1.5} />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[var(--color-border-strong)] rounded-[var(--radius-input)] bg-[var(--color-input)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">{t("equipment.all_owners")}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-secondary)]">
          <Package className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
          <p className="text-lg font-medium">{filter ? t("equipment.empty_in_category", { category: filter }) : t("equipment.empty")}</p>
          <p className="text-sm mt-1">{t("equipment.empty_hint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((e) => (
            <LocalizedLink key={e.id} to={`/app/equipment/${e.id}`} className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden no-underline hover:border-primary-400 hover:shadow-sm transition-all">
              <div className="h-40 bg-[var(--color-input)] flex items-center justify-center">
                {e.photos[0] ? (
                  <img src={e.photos[0]} alt={e.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
                )}
              </div>
              <div className="p-4">
                <div>
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{e.name}</h3>
                  <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)] mt-1">{e.category}</span>
                </div>
                {e.description && <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">{e.description}</p>}
                <div className="flex items-center mt-3 pt-3 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                      {e.owner.firstName[0]}{e.owner.lastName[0]}
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">{e.owner.firstName} {e.owner.lastName}</span>
                  </div>
                </div>
              </div>
            </LocalizedLink>
          ))}
        </div>
      )}

      {showForm && (
        <EquipmentForm
          communityId={communityId!}
          onClose={() => setShowForm(false)}
          onCreated={loadEquipment}
        />
      )}
    </div>
  );
}

function EquipmentForm({ communityId, onClose, onCreated }: { communityId: string; onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(EQUIPMENT_CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/equipment/community/${communityId}`, {
        method: "POST",
        body: JSON.stringify({ name, description, category }),
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
        className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-bold">{t("equipment.form.title")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("equipment.form.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            placeholder={t("equipment.form.name_placeholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("equipment.form.category")}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
          >
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("equipment.form.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            rows={3}
            placeholder={t("equipment.form.description_placeholder")}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">
            {tc("actions.cancel")}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">
            {loading ? "..." : tc("actions.add")}
          </button>
        </div>
      </form>
    </div>
  );
}
