import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { SEO } from "../../components/SEO";
import { useInView } from "../../hooks/useInView";
import { Wrench, Users, MessageCircle, Check } from "lucide-react";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function FeaturesPage() {
  const { t } = useTranslation("landing");
  const { t: tc } = useTranslation("common");

  const sections = [
    {
      icon: <Wrench className="w-10 h-10" strokeWidth={1.5} />,
      bgColor: "bg-primary-50",
      textColor: "text-primary-600",
      title: t("features.equipment.detail_title"),
      description: t("features.equipment.detail_description"),
      features: t("features.equipment.detail_features", { returnObjects: true }) as string[],
      reverse: false,
    },
    {
      icon: <Users className="w-10 h-10" strokeWidth={1.5} />,
      bgColor: "bg-accent-50",
      textColor: "text-accent-600",
      title: t("features.artisans.detail_title"),
      description: t("features.artisans.detail_description"),
      features: t("features.artisans.detail_features", { returnObjects: true }) as string[],
      reverse: true,
    },
    {
      icon: <MessageCircle className="w-10 h-10" strokeWidth={1.5} />,
      bgColor: "bg-warm-50",
      textColor: "text-warm-600",
      title: t("features.messaging.detail_title"),
      description: t("features.messaging.detail_description"),
      features: t("features.messaging.detail_features", { returnObjects: true }) as string[],
      reverse: false,
    },
  ];

  return (
    <div>
      <SEO title={tc("seo.features.title")} description={tc("seo.features.description")} />
      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-4 py-16 md:py-20 text-center">
        <Section>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
            {t("features.page_title")}
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)] max-w-lg mx-auto">
            {t("features.page_subtitle")}
          </p>
        </Section>
      </section>

      {/* Feature sections */}
      <div className="space-y-0">
        {sections.map((section, i) => (
          <section
            key={i}
            className={i % 2 === 1 ? "bg-[var(--color-card)]" : ""}
          >
            <div className="max-w-[1120px] mx-auto px-4 py-16 md:py-20">
              <Section>
                <div
                  className={`flex flex-col ${
                    section.reverse ? "md:flex-row-reverse" : "md:flex-row"
                  } items-center gap-8 md:gap-12`}
                >
                  {/* Text side */}
                  <div className="flex-1">
                    <div
                      className={`w-14 h-14 mb-4 ${section.bgColor} ${section.textColor} rounded-[var(--radius-card)] flex items-center justify-center`}
                    >
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                      {section.title}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.features.map((feature, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]"
                        >
                          <Check
                            className="w-4 h-4 text-primary-600 shrink-0 mt-0.5"
                            strokeWidth={1.5}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual placeholder */}
                  <div className="flex-1 w-full">
                    <div
                      className={`${section.bgColor} rounded-[var(--radius-card)] aspect-[4/3] flex flex-col items-center justify-center gap-3`}
                    >
                      <div className={`${section.textColor} opacity-20`}>
                        {section.icon}
                      </div>
                      <span className="text-sm text-[var(--color-text-tertiary)]">
                        {t("features.preview_placeholder")}
                      </span>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="bg-[var(--color-card)] border-t border-[var(--color-border)]">
        <div className="max-w-[1120px] mx-auto px-4 py-16 md:py-20 text-center">
          <Section>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              {t("cta.title")}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <LocalizedLink
              to="/register"
              className="inline-block px-6 py-3 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm transition-colors"
            >
              {t("cta.button")}
            </LocalizedLink>
          </Section>
        </div>
      </section>
    </div>
  );
}
