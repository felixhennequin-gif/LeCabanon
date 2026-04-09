import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";

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
      <Link to={`/communities/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline">
        <ArrowLeft className="w-4 h-4" />
        Retour à la communauté
      </Link>

      <h1 className="text-2xl font-bold mb-8">Administration — {community.name}</h1>

      {/* Section 1: Edit info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informations</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              {...register("name")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Enregistrement…" : "Sauvegarder"}
            </button>
            {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
          </div>
        </form>
      </section>

      {/* Section 2: Access code */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Code d'accès</h2>
        <div className="flex items-center gap-3 mb-4">
          <code className="bg-gray-100 px-3 py-1.5 rounded text-sm font-mono tracking-wider">
            {showCode ? accessCode : "••••••••"}
          </code>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
            title={showCode ? "Masquer" : "Révéler"}
          >
            {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleRegenerateCode}
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 bg-transparent border border-primary-300 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Regénérer le code
        </button>
      </section>

      {/* Section 3: Members */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Membres</h2>
        <p className="text-sm text-gray-400 mb-4">{community._count.members} membre{community._count.members > 1 ? "s" : ""}</p>
        <div className="space-y-3">
          {community.members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
                  {m.user.firstName[0]}{m.user.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {m.user.firstName} {m.user.lastName}
                    {m.role === "ADMIN" && <span className="ml-1.5 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">Admin</span>}
                  </p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
              </div>
              {m.userId !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(m)}
                  className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Danger zone */}
      <section className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Zone dangereuse</h2>
        <p className="text-sm text-red-600 mb-4">Ces actions sont irréversibles.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer"
        >
          Supprimer la communauté
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-700 mb-3">Supprimer la communauté</h3>
            <p className="text-sm text-gray-600 mb-4">
              Êtes-vous sûr ? Cette action supprimera définitivement la communauté, tout le matériel, les artisans, les avis et les messages. Cette action est irréversible.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Tapez <strong>{community.name}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={community.name}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmName(""); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer bg-white"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCommunity}
                disabled={deleteConfirmName !== community.name}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
