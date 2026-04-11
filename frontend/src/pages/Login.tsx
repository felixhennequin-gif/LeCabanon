import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { Warehouse } from "lucide-react";

export function Login() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Warehouse className="w-12 h-12 text-primary-600 mx-auto mb-3" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{t("login.title")}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] shadow-sm border border-[var(--color-border)] space-y-4">
        {error && (
          <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("login.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
            placeholder={t("login.placeholder_email")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("login.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-[var(--color-page)] py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-[var(--color-text-secondary)]">
        {t("login.no_account")}{" "}
        <LocalizedLink to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"} className="text-primary-600 hover:underline">
          {t("login.signup_link")}
        </LocalizedLink>
      </p>
    </div>
  );
}
