import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { LocalizedLink } from "../components/LocalizedLink";
import { Warehouse, Users, AlertTriangle } from "lucide-react";

interface InviteInfo {
  communityName: string;
  communityDescription?: string;
  createdByName: string;
  expiresAt: string;
}

export function InvitationLanding() {
  const { t } = useTranslation("app");
  const { token } = useParams<{ token: string }>();
  const navigate = useLocalizedNavigate();
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (token) {
      api<InviteInfo>(`/invite/${token}`, { skipAuth: true })
        .then(setInfo)
        .catch((err) => setError(err instanceof Error ? err.message : t("invitation.invalid_link")))
        .finally(() => setLoading(false));
    }
  }, [token, t]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)] px-4">
        <div className="w-full max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-accent-500 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t("invitation.invalid_title")}</h1>
          <p className="text-[var(--color-text-secondary)] mb-6">{error || t("invitation.invalid_message")}</p>
          <LocalizedLink to="/app" className="inline-block bg-primary-600 text-[var(--color-page)] px-6 py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline">
            {t("invitation.back_home")}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    try {
      const result = await api<{ communityId: string }>(`/invite/${token}/join`, { method: "POST" });
      navigate(`/app/communities/${result.communityId}`, { replace: true });
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : t("invitation.join_error"));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Warehouse className="w-12 h-12 text-primary-600 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-secondary)]">{t("invitation.invited_to_join")}</p>
        </div>

        <div className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] shadow-sm border border-[var(--color-border)] text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">{info.communityName}</h1>
          {info.communityDescription && (
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">{info.communityDescription}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-tertiary)] mb-6">
            <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("invitation.invitation_from", { name: info.createdByName })}
          </div>

          {joinError && (
            <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-input)] text-sm mb-4">{joinError}</div>
          )}

          {user ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-primary-600 text-[var(--color-page)] py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
            >
              {joining ? "..." : t("invitation.join_button")}
            </button>
          ) : (
            <LocalizedLink
              to={`/login?redirect=/invite/${token}`}
              className="block w-full bg-primary-600 text-[var(--color-page)] py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-center"
            >
              {t("invitation.login_to_join")}
            </LocalizedLink>
          )}
        </div>
      </div>
    </div>
  );
}
