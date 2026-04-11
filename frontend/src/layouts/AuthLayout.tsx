import { Outlet } from "react-router-dom";
import { LocalizedLink } from "../components/LocalizedLink";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export function AuthLayout() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen bg-[var(--color-page)] flex flex-col">
      <div className="p-4">
        <LocalizedLink
          to="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] no-underline"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          {t("actions.back")}
        </LocalizedLink>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <Outlet />
      </div>
    </div>
  );
}
