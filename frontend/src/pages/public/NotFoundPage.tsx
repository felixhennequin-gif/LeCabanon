import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import { LocalizedLink } from "../../components/LocalizedLink";
import { SEO } from "../../components/SEO";

export function NotFoundPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <SEO
        title={t("notFound.seoTitle")}
        description={t("notFound.description")}
      />
      <section className="max-w-[640px] mx-auto px-4 py-24 md:py-32 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
          <Home className="w-10 h-10" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-3">
          {t("notFound.title")}
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base md:text-lg mb-8">
          {t("notFound.description")}
        </p>
        <LocalizedLink
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 no-underline transition-colors"
        >
          {t("notFound.backHome")}
        </LocalizedLink>
      </section>
    </>
  );
}
