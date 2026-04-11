import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { useInView } from "../../hooks/useInView";
import { Mail } from "lucide-react";

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

export function AboutPage() {
  const { t } = useTranslation("landing");

  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-4 py-16 md:py-20 text-center">
        <Section>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
            {t("about.title")}
          </h1>
          <p className="mt-4 text-[var(--color-text-secondary)] max-w-lg mx-auto">
            {t("about.subtitle")}
          </p>
        </Section>
      </section>

      {/* Story */}
      <section className="bg-[var(--color-card)]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <Section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              {t("about.story_title")}
            </h2>
            <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
              <p>{t("about.story_p1")}</p>
              <p>{t("about.story_p2")}</p>
              <p>{t("about.story_p3")}</p>
            </div>
          </Section>
        </div>
      </section>

      {/* Vision */}
      <section>
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <Section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              {t("about.vision_title")}
            </h2>
            <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
              <p>{t("about.vision_p1")}</p>
              <p>{t("about.vision_p2")}</p>
            </div>
          </Section>
        </div>
      </section>

      {/* Creator */}
      <section className="bg-[var(--color-card)]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <Section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">
              {t("about.creator_title")}
            </h2>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary-600">
                  {t("about.creator_initials")}
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {t("about.creator_text")}
              </p>
            </div>
          </Section>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
          <Section>
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
              {t("about.contact_title")}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {t("about.contact_text")}
            </p>
            <LocalizedLink
              to="/contact"
              className="inline-block px-6 py-2.5 border border-primary-600 text-primary-600 rounded-[var(--radius-button)] font-medium hover:bg-primary-50 no-underline text-sm transition-colors"
            >
              {t("about.contact_link")}
            </LocalizedLink>
          </Section>
        </div>
      </section>
    </div>
  );
}
