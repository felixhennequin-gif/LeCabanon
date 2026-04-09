import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, ArrowLeft, Package, User } from "lucide-react";

const EQUIPMENT_CATEGORIES = [
  "Jardinage", "Bricolage", "Nettoyage", "Électroportatif",
  "Échelles & échafaudages", "Automobile", "Déménagement", "Cuisine / Réception",
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
      <Link to={`/communities/${communityId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Matériel à prêter</h1>
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
          className={`px-3 py-1 text-sm rounded-full cursor-pointer border ${!filter ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
        >
          Tout
        </button>
        {EQUIPMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat === filter ? "" : cat)}
            className={`px-3 py-1 text-sm rounded-full cursor-pointer border ${filter === cat ? "bg-primary-600 text-white border-primary-600" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Owner filter */}
      {owners.length > 1 && (
        <div className="flex items-center gap-2 mb-6">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous les propriétaires</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Aucun matériel{filter ? ` en "${filter}"` : ""}</p>
          <p className="text-sm mt-1">Soyez le premier à ajouter du matériel à prêter !</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((e) => (
            <Link key={e.id} to={`/equipment/${e.id}`} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden no-underline hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all">
              <div className="h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {e.photos[0] ? (
                  <img src={e.photos[0]} alt={e.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{e.name}</h3>
                  <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full mt-1">{e.category}</span>
                </div>
                {e.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{e.description}</p>}
                <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                      {e.owner.firstName[0]}{e.owner.lastName[0]}
                    </div>
                    <span className="text-xs text-gray-500">{e.owner.firstName} {e.owner.lastName}</span>
                  </div>
                </div>
              </div>
            </Link>
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
        className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-bold">Ajouter du matériel</h2>
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:text-gray-100"
            placeholder="Perceuse Bosch"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:text-gray-100"
          >
            {EQUIPMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 dark:text-gray-100"
            rows={3}
            placeholder="En bon état, avec ses embouts"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 cursor-pointer">
            {loading ? "..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
