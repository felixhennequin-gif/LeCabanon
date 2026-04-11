import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Eye, EyeOff, RefreshCw, Trash2, Link2, Copy, Check, Share2, X as XIcon } from "lucide-react";

interface Member {
  userId: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; email: string; photo?: string | null };
}

interface CommunityData {
  id: string;
  name: string;
  description?: string;
  accessCode: string;
  role: string;
  members: Member[];
  _count: { members: number; equipment: number; artisans: number };
}

interface InvitationData {
  id: string;
  token: string;
  expiresAt: string;
  maxUses: number | null;
  uses: number;
  active: boolean;
  createdAt: string;
  expired: boolean;
  createdBy: { firstName: string; lastName: string };
}

interface NewInvitation {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  maxUses: number | null;
  uses: number;
  active: boolean;
}

const DURATION_OPTIONS = [
  { label: "1 heure", value: 1 },
  { label: "6 heures", value: 6 },
  { label: "12 heures", value: 12 },
  { label: "24 heures", value: 24 },
  { label: "48 heures", value: 48 },
  { label: "7 jours", value: 168 },
  { label: "30 jours", value: 720 },
];

const editSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

export function CommunityAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [newInvite, setNewInvite] = useState<NewInvitation | null>(null);
  const [inviteDuration, setInviteDuration] = useState(24);
  const [inviteMaxUses, setInviteMaxUses] = useState("");
  const [inviteCreating, setInviteCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (id) {
      api<CommunityData>(`/communities/${id}`)
        .then((data) => {
          if (data.role !== "ADMIN") {
            navigate(`/communities/${id}`, { replace: true });
            return;
          }
          setCommunity(data);
          setAccessCode(data.accessCode);
          reset({ name: data.name, description: data.description || "" });
          api<InvitationData[]>(`/communities/${id}/invitations`).then(setInvitations);
        })
        .catch(() => navigate("/communities", { replace: true }))
        .finally(() => setLoading(false));
    }
  }, [id, navigate, reset]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (!community) return null;

  async function onSave(data: EditForm) {
    await api(`/communities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setCommunity((prev) => prev ? { ...prev, name: data.name, description: data.description } : prev);
    setSaveMsg("Modifications enregistrées");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handleRegenerateCode() {
    if (!confirm("Attention : l'ancien code ne fonctionnera plus. Les liens d'invitation existants seront invalidés. Continuer ?")) return;
    const res = await api<{ accessCode: string }>(`/communities/${id}/regenerate-code`, { method: "POST" });
    setAccessCode(res.accessCode);
    setShowCode(true);
  }

  async function handleRemoveMember(member: Member) {
    if (!confirm(`Retirer ${member.user.firstName} ${member.user.lastName} de la communauté ?`)) return;
    await api(`/communities/${id}/members/${member.userId}`, { method: "DELETE" });
    setCommunity((prev) => prev ? {
      ...prev,
      members: prev.members.filter((m) => m.userId !== member.userId),
      _count: { ...prev._count, members: prev._count.members - 1 },
    } : prev);
  }

  async function handleDeleteCommunity() {
    await fetch(`/api/communities/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    navigate("/communities", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/communities/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Retour à la communauté
      </Link>

      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">Administration — {community.name}</h1>

      {/* Section 1: Edit info */}
      <section className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Informations</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nom</label>
            <input
              {...register("name")}
              className="w-full border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
            {errors.name && <p className="text-[var(--color-error)] text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 text-[var(--color-page)] px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Enregistrement…" : "Sauvegarder"}
            </button>
            {saveMsg && <span className="text-sm text-[var(--color-success)]">{saveMsg}</span>}
          </div>
        </form>
      </section>

      {/* Section 2: Access code */}
      <section className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Code d'accès</h2>
        <div className="flex items-center gap-3 mb-4">
          <code className="bg-[var(--color-input)] px-3 py-1.5 rounded-[var(--radius-input)] text-sm font-mono tracking-wider text-[var(--color-text-primary)]">
            {showCode ? accessCode : "••••••••"}
          </code>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer"
            title={showCode ? "Masquer" : "Révéler"}
          >
            {showCode ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
        <button
          onClick={handleRegenerateCode}
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 bg-transparent border border-primary-400 rounded-[var(--radius-button)] px-3 py-1.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          Regénérer le code
        </button>
      </section>

      {/* Section 3: Invitations */}
      <section className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Invitations</h2>

        {/* Create invitation form */}
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Durée de validité</label>
            <select
              value={inviteDuration}
              onChange={(e) => setInviteDuration(Number(e.target.value))}
              className="border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-2 text-sm bg-[var(--color-input)] text-[var(--color-text-primary)]"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Max. utilisations</label>
            <input
              type="number"
              min="1"
              value={inviteMaxUses}
              onChange={(e) => setInviteMaxUses(e.target.value)}
              placeholder="Illimité"
              className="border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-2 text-sm w-28 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>
          <button
            onClick={async () => {
              setInviteCreating(true);
              try {
                const body: Record<string, unknown> = { expiresIn: inviteDuration };
                if (inviteMaxUses) body.maxUses = Number(inviteMaxUses);
                const inv = await api<NewInvitation>(`/communities/${id}/invitations`, {
                  method: "POST",
                  body: JSON.stringify(body),
                });
                setNewInvite(inv);
                setCopied(false);
                api<InvitationData[]>(`/communities/${id}/invitations`).then(setInvitations);
              } finally {
                setInviteCreating(false);
              }
            }}
            disabled={inviteCreating}
            className="inline-flex items-center gap-1.5 bg-primary-600 text-[var(--color-page)] px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
          >
            <Link2 className="w-4 h-4" strokeWidth={1.5} />
            {inviteCreating ? "..." : "Générer un lien"}
          </button>
        </div>

        {/* Newly generated link */}
        {newInvite && (
          <div className="bg-primary-50 border border-primary-200 rounded-[var(--radius-button)] p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-700">Lien d'invitation généré</span>
              <button onClick={() => setNewInvite(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer">
                <XIcon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                readOnly
                value={newInvite.url}
                className="flex-1 bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-1.5 text-sm font-mono text-[var(--color-text-primary)]"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newInvite.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--color-border-strong)] rounded-[var(--radius-button)] bg-[var(--color-input)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" strokeWidth={1.5} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                {copied ? "Copié" : "Copier"}
              </button>
              {typeof navigator.share === "function" && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: `Rejoignez ${community!.name} sur LeCabanon`,
                      text: `Vous êtes invité à rejoindre la communauté ${community!.name} sur LeCabanon !`,
                      url: newInvite.url,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--color-border-strong)] rounded-[var(--radius-button)] bg-[var(--color-input)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] cursor-pointer"
                >
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  Partager
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Expire le {new Date(newInvite.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {newInvite.maxUses ? ` — ${newInvite.maxUses} utilisation${newInvite.maxUses > 1 ? "s" : ""} max.` : " — utilisations illimitées"}
            </p>
          </div>
        )}

        {/* Existing invitations list */}
        {invitations.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Invitations existantes</h3>
            {invitations.map((inv) => {
              const status = !inv.active ? "Révoqué" : inv.expired ? "Expiré" : "Actif";
              const statusColor = status === "Actif" ? "text-[var(--color-success)] bg-primary-50" : "text-[var(--color-text-secondary)] bg-[var(--color-input)]";
              return (
                <div key={inv.id} className={`flex items-center justify-between p-3 rounded-[var(--radius-button)] border ${inv.expired ? "border-[var(--color-border)] opacity-60" : "border-[var(--color-border)]"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono text-[var(--color-text-secondary)] truncate">...{inv.token.slice(-8)}</code>
                      <span className={`text-xs px-1.5 py-0.5 rounded-[var(--radius-pill)] ${statusColor}`}>{status}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Créé le {new Date(inv.createdAt).toLocaleDateString("fr-FR")} — Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")} — {inv.uses}/{inv.maxUses ?? "\u221E"} utilisations
                    </p>
                  </div>
                  {!inv.expired && inv.active && (
                    <button
                      onClick={async () => {
                        if (!confirm("Révoquer cette invitation ?")) return;
                        await fetch(`/api/communities/${id}/invitations/${inv.id}`, {
                          method: "DELETE",
                          headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
                        });
                        setInvitations((prev) => prev.map((i) => i.id === inv.id ? { ...i, active: false, expired: true } : i));
                      }}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-transparent border-none cursor-pointer ml-3"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 4: Members */}
      <section className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Membres</h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{community._count.members} membre{community._count.members > 1 ? "s" : ""}</p>
        <div className="space-y-3">
          {community.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                  {m.user.firstName[0]}{m.user.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {m.user.firstName} {m.user.lastName}
                    {m.role === "ADMIN" && <span className="ml-1.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-[var(--radius-pill)]">Admin</span>}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{m.user.email}</p>
                </div>
              </div>
              {m.userId !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(m)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] bg-transparent border-none cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Danger zone */}
      <section className="rounded-[var(--radius-card)] border-2 border-[var(--color-error)] bg-[var(--color-error-light)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-error)] mb-2">Zone dangereuse</h2>
        <p className="text-sm text-[var(--color-error)] mb-4">Ces actions sont irréversibles.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-[var(--color-error)] text-[var(--color-page)] px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90 cursor-pointer"
        >
          Supprimer la communauté
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--color-error)] mb-3">Supprimer la communauté</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Êtes-vous sûr ? Cette action supprimera définitivement la communauté, tout le matériel, les artisans, les avis et les messages. Cette action est irréversible.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Tapez <strong>{community.name}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              className="w-full border border-[var(--color-border-strong)] rounded-[var(--radius-input)] px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-error)] focus:border-[var(--color-error)] bg-[var(--color-input)] text-[var(--color-text-primary)]"
              placeholder={community.name}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmName(""); }}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] hover:bg-[var(--color-hover)] cursor-pointer bg-[var(--color-input)]"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={deleteConfirmName !== community.name}
                className="px-4 py-2 text-sm text-[var(--color-page)] bg-[var(--color-error)] rounded-[var(--radius-button)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
