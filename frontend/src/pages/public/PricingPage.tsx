import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { Check } from "lucide-react";

export function PricingPage() {
  const { t } = useTranslation("landing");

  const features = t("pricing.free.features", { returnObjects: true }) as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
          {t("pricing.title")}
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          {t("pricing.subtitle")}
        </p>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {t("pricing.free.name")}
          </h2>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            {t("pricing.free.price")}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t("pricing.free.description")}
          </p>
          <ul className="mt-6 space-y-3 text-left">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Check className="w-4 h-4 text-primary-600 shrink-0" strokeWidth={1.5} />
                {feature}
              </li>
            ))}
          </ul>
          <LocalizedLink
            to="/register"
            className="block mt-8 px-6 py-2.5 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm"
          >
            {t("hero.cta_primary")}
          </LocalizedLink>
        </div>
        <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-6">
          {t("pricing.coming_soon")}
        </p>
      </div>
    </div>
  );
}
