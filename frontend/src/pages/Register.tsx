import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Warehouse } from "lucide-react";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
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
      navigate(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/communities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Warehouse className="w-12 h-12 text-primary-600 mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Créer un compte</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Rejoignez votre communauté de voisins</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] shadow-sm border border-[var(--color-border)] space-y-4">
          {error && (
            <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Prénom</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nom</label>
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
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Mot de passe</label>
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
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-[var(--color-text-secondary)]">
          Déjà un compte ?{" "}
          <Link to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"} className="text-primary-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
