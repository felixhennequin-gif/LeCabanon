import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Package, MessageCircle, Trash2 } from "lucide-react";

interface EquipmentData {
  id: string;
  name: string;
  description?: string;
  category: string;
  photos: string[];
  communityId: string;
  ownerId: string;
  owner: { id: string; firstName: string; lastName: string; photo?: string | null };
  createdAt: string;
}

export function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api<EquipmentData>(`/equipment/${id}`)
        .then(setEquipment)
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function handleDelete() {
    if (!equipment || !confirm("Supprimer ce matériel ?")) return;
    await api(`/equipment/${equipment.id}`, { method: "DELETE" });
    navigate(-1);
  }

  async function handleContact() {
    if (!equipment) return;
    const conv = await api<{ id: string }>("/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientId: equipment.ownerId, communityId: equipment.communityId }),
    });
    navigate(`/messages/${conv.id}?context=equipment&equipmentName=${encodeURIComponent(equipment.name)}`);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!equipment) return <div className="text-center py-12 text-[var(--color-text-secondary)]">Matériel introuvable</div>;

  const isOwner = equipment.ownerId === user?.id;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Retour
      </button>

      {/* Photo */}
      <div className="h-56 sm:h-72 bg-[var(--color-input)] rounded-[var(--radius-card)] overflow-hidden mb-6 flex items-center justify-center">
        {equipment.photos[0] ? (
          <img src={equipment.photos[0]} alt={equipment.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
        )}
      </div>

      {/* Info card */}
      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <span className="inline-block text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)] mt-2">
              {equipment.category}
            </span>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-transparent border-none cursor-pointer">
              <Trash2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {equipment.description && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-4 whitespace-pre-line">{equipment.description}</p>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
          <Link to={`/users/${equipment.owner.id}`} className="flex items-center gap-3 no-underline hover:underline">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
              {equipment.owner.firstName[0]}{equipment.owner.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{equipment.owner.firstName} {equipment.owner.lastName}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Propriétaire</p>
            </div>
          </Link>

          {!isOwner && (
            <button
              onClick={handleContact}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              Contacter
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)] text-center">
        Ajouté le {new Date(equipment.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
