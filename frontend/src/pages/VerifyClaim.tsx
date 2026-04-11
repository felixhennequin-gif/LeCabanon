import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useLocalizedNavigate } from "../hooks/useLocalizedNavigate";
import { BadgeCheck, AlertCircle } from "lucide-react";

function VerifyClaimInner({ id, token }: { id: string; token: string }) {
  const { t } = useTranslation("app");
  const navigate = useLocalizedNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/artisans/${id}/verify-claim`, {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : t("verify_claim.error_title"));
      });
  }, [id, token, t]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8">
          <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t("verify_claim.error_title")}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => navigate(`/app/artisans/${id}`)}
            className="px-6 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] text-sm cursor-pointer"
          >
            {t("verify_claim.back_to_profile")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8">
        <BadgeCheck className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t("artisans.claim.success_title")}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {t("artisans.claim.success_message")}
        </p>
        <button
          onClick={() => navigate(`/app/artisans/${id}`)}
          className="px-6 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] text-sm cursor-pointer"
        >
          {t("artisans.claim.view_profile")}
        </button>
      </div>
    </div>
  );
}

export function VerifyClaim() {
  const { t } = useTranslation("app");
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!id || !token) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8">
          <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{t("verify_claim.invalid_link_title")}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t("verify_claim.invalid_link_message")}</p>
        </div>
      </div>
    );
  }

  return <VerifyClaimInner key={`${id}-${token}`} id={id} token={token} />;
}
