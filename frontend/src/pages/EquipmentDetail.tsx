import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { Avatar } from "../components/Avatar";
import { ArrowLeft, Package, MessageCircle, Trash2, Plus, Loader2, X } from "lucide-react";

interface EquipmentPhoto {
  id: string;
  url: string;
  order: number;
}

interface EquipmentData {
  id: string;
  name: string;
  description?: string;
  category: string;
  photos: EquipmentPhoto[];
  communityId: string;
  ownerId: string;
  owner: { id: string; firstName: string; lastName: string; photo?: string | null };
  createdAt: string;
}

export function EquipmentDetail() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useLocalizedNavigate();
  const [equipment, setEquipment] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      api<EquipmentData>(`/equipment/${id}`)
        .then((data) => {
          setEquipment(data);
          setActivePhoto(0);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  async function handleDelete() {
    if (!equipment || !confirm(t("equipment.delete_confirm"))) return;
    await api(`/equipment/${equipment.id}`, { method: "DELETE" });
    navigate(-1);
  }

  async function handleContact() {
    if (!equipment) return;
    const conv = await api<{ id: string }>("/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientId: equipment.ownerId, communityId: equipment.communityId }),
    });
    navigate(`/app/messages/${conv.id}`, {
      state: { equipmentContext: { id: equipment.id, name: equipment.name } },
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!equipment || !e.target.files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of e.target.files) {
        formData.append("photos", file);
      }
      const newPhotos = await api<EquipmentPhoto[]>(`/equipment/${equipment.id}/photos`, {
        method: "POST",
        body: formData,
      });
      setEquipment({ ...equipment, photos: [...equipment.photos, ...newPhotos] });
    } catch {
      // error handled silently
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoDelete(photoId: string) {
    if (!equipment) return;
    await api(`/equipment/${equipment.id}/photos/${photoId}`, { method: "DELETE" });
    const updated = equipment.photos.filter((p) => p.id !== photoId);
    setEquipment({ ...equipment, photos: updated });
    if (activePhoto >= updated.length) setActivePhoto(Math.max(0, updated.length - 1));
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!equipment) return <div className="text-center py-12 text-[var(--color-text-secondary)]">{t("equipment.not_found")}</div>;

  const isOwner = equipment.ownerId === user?.id;
  const mainPhoto = equipment.photos[activePhoto];

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 bg-transparent border-none cursor-pointer p-0">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> {tc("actions.back")}
      </button>

      <div className="h-56 sm:h-72 bg-[var(--color-input)] rounded-[var(--radius-card)] overflow-hidden mb-3 flex items-center justify-center relative">
        {mainPhoto ? (
          <img src={mainPhoto.url} alt={equipment.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
        )}
      </div>

      {(equipment.photos.length > 1 || isOwner) && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {equipment.photos.map((p, i) => (
            <div key={p.id} className="relative group">
              <button
                type="button"
                onClick={() => setActivePhoto(i)}
                className={`w-16 h-16 rounded-[var(--radius-input)] overflow-hidden border-2 cursor-pointer p-0 ${i === activePhoto ? "border-primary-600" : "border-[var(--color-border)]"}`}
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handlePhotoDelete(p.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-error)] text-[var(--color-page)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer border-none transition-opacity"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
          {isOwner && equipment.photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-16 h-16 rounded-[var(--radius-input)] border-2 border-dashed border-[var(--color-border-strong)] flex items-center justify-center cursor-pointer bg-transparent text-[var(--color-text-tertiary)] hover:border-primary-400 hover:text-primary-600"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} /> : <Plus className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      )}

      {isOwner && equipment.photos.length === 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-button)] text-[var(--color-text-secondary)] hover:border-primary-400 hover:text-primary-600 bg-transparent cursor-pointer"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
            {t("photos.add")}
          </button>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{t("photos.formats")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      )}

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
          <LocalizedLink to={`/app/users/${equipment.owner.id}`} className="flex items-center gap-3 no-underline hover:underline">
            <Avatar src={equipment.owner.photo} name={`${equipment.owner.firstName} ${equipment.owner.lastName}`} size="md" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{equipment.owner.firstName} {equipment.owner.lastName}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{t("equipment.owner")}</p>
            </div>
          </LocalizedLink>

          {!isOwner && (
            <button
              onClick={handleContact}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              {t("equipment.contact")}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)] text-center">
        {t("equipment.added_on", { date: new Date(equipment.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) })}
      </p>
    </div>
  );
}
