import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { SEO } from "../components/SEO";
import { Warehouse } from "lucide-react";

export function Register() {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const { register } = useAuth();
  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <SEO title={tc("seo.register.title")} description={tc("seo.register.description")} />
      <div className="text-center mb-8">
        <Warehouse className="w-12 h-12 text-primary-600 mx-auto mb-3" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t("register.title")}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{t("register.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] shadow-sm border border-[var(--color-border)] space-y-4">
        {error && (
          <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("register.firstname")}</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("register.lastname")}</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("register.email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("register.password")}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-[var(--color-page)] py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("register.submitting") : t("register.submit")}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[var(--color-text-secondary)]">
        {t("register.has_account")}{" "}
        <LocalizedLink to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"} className="text-primary-600 hover:underline">
          {t("register.login_link")}
        </LocalizedLink>
      </p>
    </div>
  );
}
