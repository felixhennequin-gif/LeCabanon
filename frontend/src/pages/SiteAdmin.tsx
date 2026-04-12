import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { FileText, Mail, Save, Clock, CheckCircle2 } from "lucide-react";

interface SitePageSummary {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
}

interface SitePageFull extends SitePageSummary {
  content: string;
}

interface ContactMsg {
  id: string;
  name: string;
  email: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

type Tab = "pages" | "messages";

export function SiteAdmin() {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<Tab>("pages");

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
        Administration du site
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--color-input)] p-1 rounded-[var(--radius-button)] w-fit">
        <button
          onClick={() => setTab("pages")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-button)] cursor-pointer border-none transition-colors ${
            tab === "pages"
              ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm"
              : "bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <FileText className="w-4 h-4" strokeWidth={1.5} />
          {t("admin_site.pages.title")}
        </button>
        <button
          onClick={() => setTab("messages")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-button)] cursor-pointer border-none transition-colors ${
            tab === "messages"
              ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm"
              : "bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Mail className="w-4 h-4" strokeWidth={1.5} />
          {t("admin_site.contact_messages.title")}
          <UnreadBadge />
        </button>
      </div>

      {tab === "pages" ? <PagesPanel /> : <MessagesPanel />}
    </div>
  );
}

// ─── Unread badge ─────────────────────────────────────────
function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    api<ContactMsg[]>("/admin/contact-messages")
      .then((msgs) => setCount(msgs.filter((m) => !m.readAt).length))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full bg-[var(--color-error)] text-white">
      {count}
    </span>
  );
}

// ─── Pages Panel ──────────────────────────────────────────
function PagesPanel() {
  const { t } = useTranslation("common");
  const [pages, setPages] = useState<SitePageSummary[]>([]);
  const [editing, setEditing] = useState<SitePageFull | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<SitePageSummary[]>("/pages").then(setPages).catch(() => {});
  }, []);

  async function openEditor(slug: string) {
    const page = await api<SitePageFull>(`/pages/${slug}`);
    setEditing(page);
    setEditTitle(page.title);
    setEditContent(page.content);
    setSaved(false);
  }

  async function savePage() {
    if (!editing) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await api<SitePageFull>(`/pages/${editing.slug}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setEditing(updated);
      setPages((prev) =>
        prev.map((p) =>
          p.slug === updated.slug
            ? { ...p, title: updated.title, updatedAt: updated.updatedAt }
            : p
        )
      );
      setSaved(true);
    } catch {
      // Error handled by api wrapper
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div>
        <button
          onClick={() => setEditing(null)}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mb-4 cursor-pointer bg-transparent border-none"
        >
          ← {t("actions.back")}
        </button>

        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          {t("admin_site.pages.edit")}
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Titre
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>

          {/* Content + Preview side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                {t("admin_site.pages.content")}
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)] font-mono text-sm resize-vertical"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                {t("admin_site.pages.preview")}
              </label>
              <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 bg-[var(--color-page)] min-h-[300px] overflow-auto">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                  {editTitle}
                </h1>
                <div
                  className="site-page-content"
                  dangerouslySetInnerHTML={{ __html: editContent }}
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={savePage}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary-600 text-[var(--color-page)] px-5 py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" strokeWidth={1.5} />
              {saving ? t("actions.loading") : t("admin_site.pages.save")}
            </button>
            {saved && (
              <span className="text-sm text-[var(--color-success)]">
                {t("admin_site.pages.saved")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      {pages.length === 0 ? (
        <p className="p-6 text-[var(--color-text-tertiary)] text-sm">
          Aucune page.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">
                Titre
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">
                Slug
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">
                Dernière modification
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.id}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)] font-medium">
                  {page.title}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-tertiary)] font-mono">
                  {page.slug}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
                  {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEditor(page.slug)}
                    className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer bg-transparent border-none font-medium"
                  >
                    {t("actions.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Messages Panel ───────────────────────────────────────
function MessagesPanel() {
  const { t } = useTranslation("common");
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [selected, setSelected] = useState<ContactMsg | null>(null);

  useEffect(() => {
    api<ContactMsg[]>("/admin/contact-messages")
      .then(setMessages)
      .catch(() => {});
  }, []);

  async function openMessage(msg: ContactMsg) {
    setSelected(msg);
    if (!msg.readAt) {
      try {
        const updated = await api<ContactMsg>(
          `/admin/contact-messages/${msg.id}/read`,
          { method: "PATCH" }
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        setSelected(updated);
      } catch {
        // ignore
      }
    }
  }

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mb-4 cursor-pointer bg-transparent border-none"
        >
          ← {t("actions.back")}
        </button>

        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {selected.name}
            </h2>
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {new Date(selected.createdAt).toLocaleString("fr-FR")}
            </span>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)]">
            {selected.email}
          </p>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
              {selected.message}
            </p>
          </div>

          {selected.readAt && (
            <p className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
              <CheckCircle2 className="w-3 h-3" />
              {t("admin_site.contact_messages.read")} — {new Date(selected.readAt).toLocaleString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden">
      {messages.length === 0 ? (
        <p className="p-6 text-[var(--color-text-tertiary)] text-sm">
          {t("admin_site.contact_messages.no_messages")}
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className="w-full text-left px-4 py-3 hover:bg-[var(--color-hover)] cursor-pointer bg-transparent border-none transition-colors flex items-center gap-3"
            >
              {/* Unread indicator */}
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  msg.readAt
                    ? "bg-transparent"
                    : "bg-primary-600"
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      msg.readAt
                        ? "text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-primary)] font-semibold"
                    }`}
                  >
                    {msg.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                  {msg.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
