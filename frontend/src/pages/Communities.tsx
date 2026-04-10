import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, Users, LogIn, Copy, Check } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description?: string;
  accessCode: string;
  role: string;
  memberCount: number;
}

export function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  async function loadCommunities() {
    try {
      const data = await api<Community[]>("/communities");
      setCommunities(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes communautés</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-400 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900/30 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Rejoindre
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">Aucune communauté</p>
          <p className="text-sm mt-1">Créez ou rejoignez une communauté pour commencer</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <Link
              key={c.id}
              to={`/communities/${c.id}`}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all no-underline"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                  {c.role}
                </span>
              </div>
              {c.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{c.description}</p>}
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 dark:text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {c.memberCount} membre{c.memberCount > 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} onCreated={loadCommunities} />}
      {showJoin && <JoinCommunityModal onClose={() => setShowJoin(false)} onJoined={loadCommunities} />}
    </div>
  );
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const community = await api<{ id: string }>("/communities", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      onCreated();
      onClose();
      navigate(`/communities/${community.id}`);
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
        className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-bold">Créer une communauté</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            placeholder="Avenue Guillon"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            rows={3}
            placeholder="Partage de matos et bons plans artisans entre voisins"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 cursor-pointer">
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function JoinCommunityModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const community = await api<{ id: string }>("/communities/join", {
        method: "POST",
        body: JSON.stringify({ accessCode: code.trim().toUpperCase() }),
      });
      onJoined();
      onClose();
      navigate(`/communities/${community.id}`);
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
        className="bg-white dark:bg-slate-900 p-6 rounded-xl w-full max-w-md space-y-4"
      >
        <h2 className="text-lg font-bold">Rejoindre une communauté</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code d'accès</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100 uppercase tracking-widest text-center font-mono text-lg"
            placeholder="A1B2C3D4"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg disabled:opacity-50 cursor-pointer">
            {loading ? "..." : "Rejoindre"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AccessCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm tracking-wider cursor-pointer border-none dark:text-slate-200"
    >
      {code}
      {copied ? <Check className="w-3.5 h-3.5 text-primary-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </button>
  );
}
