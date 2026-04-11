import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
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
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
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
        <h1 className="text-2xl font-bold">{t("communities.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-accent-50 border border-accent-200 text-accent-600 rounded-[var(--radius-button)] hover:bg-accent-100 cursor-pointer"
          >
            <LogIn className="w-4 h-4" strokeWidth={1.5} />
            {tc("actions.join")}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            {tc("actions.create")}
          </button>
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-secondary)]">
          <Users className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
          <p className="text-lg font-medium">{t("communities.empty")}</p>
          <p className="text-sm mt-1">{t("communities.empty_hint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <LocalizedLink
              key={c.id}
              to={`/app/communities/${c.id}`}
              className="bg-[var(--color-card)] p-5 rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-primary-400 hover:shadow-sm transition-all no-underline"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{c.name}</h3>
                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)]">
                  {c.role}
                </span>
              </div>
              {c.description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{c.description}</p>}
              <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-text-tertiary)]">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                {c.memberCount > 1 ? t("communities.member_count_plural", { count: c.memberCount }) : t("communities.member_count", { count: c.memberCount })}
              </div>
            </LocalizedLink>
          ))}
        </div>
      )}

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} onCreated={loadCommunities} />}
      {showJoin && <JoinCommunityModal onClose={() => setShowJoin(false)} onJoined={loadCommunities} />}
    </div>
  );
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const navigate = useLocalizedNavigate();
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
      navigate(`/app/communities/${community.id}`);
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
        <h2 className="text-lg font-bold">{t("communities.create.title")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("communities.create.name")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            placeholder={t("communities.create.name_placeholder")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("communities.create.description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            rows={3}
            placeholder={t("communities.create.description_placeholder")}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">
            {tc("actions.cancel")}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">
            {loading ? t("communities.create.submitting") : t("communities.create.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

function JoinCommunityModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const navigate = useLocalizedNavigate();
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
      navigate(`/app/communities/${community.id}`);
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
        <h2 className="text-lg font-bold">{t("communities.join.title")}</h2>
        {error && <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("communities.join.access_code")}</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)] uppercase tracking-widest text-center font-mono text-lg"
            placeholder="A1B2C3D4"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-input)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] cursor-pointer">
            {tc("actions.cancel")}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] disabled:opacity-50 cursor-pointer">
            {loading ? "..." : t("communities.join.submit")}
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
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-input)] rounded-[var(--radius-input)] font-mono text-sm tracking-wider cursor-pointer border-none text-[var(--color-text-primary)]"
    >
      {code}
      {copied ? <Check className="w-3.5 h-3.5 text-primary-600" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />}
    </button>
  );
}
