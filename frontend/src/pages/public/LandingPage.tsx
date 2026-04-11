import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { Wrench, Users, MessageCircle, ArrowRight } from "lucide-react";

export function LandingPage() {
  const { t } = useTranslation("landing");

  const features = [
    {
      icon: <Wrench className="w-8 h-8" strokeWidth={1.5} />,
      title: t("features.equipment.title"),
      description: t("features.equipment.description"),
    },
    {
      icon: <Users className="w-8 h-8" strokeWidth={1.5} />,
      title: t("features.artisans.title"),
      description: t("features.artisans.description"),
    },
    {
      icon: <MessageCircle className="w-8 h-8" strokeWidth={1.5} />,
      title: t("features.messaging.title"),
      description: t("features.messaging.description"),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-primary)] leading-tight">
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <LocalizedLink
            to="/register"
            className="px-6 py-3 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm"
          >
            {t("hero.cta_primary")}
          </LocalizedLink>
          <LocalizedLink
            to="/fonctionnalites"
            className="px-6 py-3 text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] rounded-[var(--radius-button)] hover:bg-[var(--color-hover)] no-underline text-sm"
          >
            {t("hero.cta_secondary")}
          </LocalizedLink>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--color-card)] border-y border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
            {t("features.title")}
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 text-primary-600 rounded-[var(--radius-card)] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-3">
          {t("cta.title", { ns: "landing" })}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
          {t("cta.subtitle", { ns: "landing" })}
        </p>
        <LocalizedLink
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm"
        >
          {t("cta.button", { ns: "landing" })}
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </LocalizedLink>
      </section>
    </div>
  );
}
