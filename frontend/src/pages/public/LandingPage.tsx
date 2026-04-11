import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { useInView } from "../../hooks/useInView";
import {
  Wrench,
  Users,
  MessageCircle,
  DoorOpen,
  ArrowLeftRight,
  Star,
  ArrowRight,
} from "lucide-react";

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

export function LandingPage() {
  const { t } = useTranslation("landing");

  const features = [
    {
      icon: <Wrench className="w-8 h-8" strokeWidth={1.5} />,
      bgColor: "bg-primary-50",
      textColor: "text-primary-600",
      title: t("features.equipment.title"),
      description: t("features.equipment.description"),
    },
    {
      icon: <Users className="w-8 h-8" strokeWidth={1.5} />,
      bgColor: "bg-accent-50",
      textColor: "text-accent-600",
      title: t("features.artisans.title"),
      description: t("features.artisans.description"),
    },
    {
      icon: <MessageCircle className="w-8 h-8" strokeWidth={1.5} />,
      bgColor: "bg-warm-50",
      textColor: "text-warm-600",
      title: t("features.messaging.title"),
      description: t("features.messaging.description"),
    },
  ];

  const steps = [
    {
      icon: <DoorOpen className="w-6 h-6" strokeWidth={1.5} />,
      number: "1",
      title: t("howItWorks.step1.title"),
      description: t("howItWorks.step1.description"),
    },
    {
      icon: <ArrowLeftRight className="w-6 h-6" strokeWidth={1.5} />,
      number: "2",
      title: t("howItWorks.step2.title"),
      description: t("howItWorks.step2.description"),
    },
    {
      icon: <Star className="w-6 h-6" strokeWidth={1.5} />,
      number: "3",
      title: t("howItWorks.step3.title"),
      description: t("howItWorks.step3.description"),
    },
  ];

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-4 py-20 md:py-32 text-center">
        <Section>
          <h1 className="text-4xl md:text-[56px] font-bold text-[var(--color-text-primary)] leading-tight">
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-lg text-[var(--color-text-secondary)] max-w-[540px] mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <LocalizedLink
              to="/register"
              className="px-6 py-3 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm transition-colors"
            >
              {t("hero.cta_primary")}
            </LocalizedLink>
            <button
              onClick={scrollToFeatures}
              className="px-6 py-3 text-primary-600 border border-primary-600 rounded-[var(--radius-button)] hover:bg-primary-50 text-sm font-medium cursor-pointer bg-transparent transition-colors"
            >
              {t("hero.cta_secondary")}
            </button>
          </div>
        </Section>
      </section>

      {/* Features */}
      <section
        id="features"
        className="bg-[var(--color-card)] border-y border-[var(--color-border)]"
      >
        <div className="max-w-[1120px] mx-auto px-4 py-16 md:py-24">
          <Section>
            <h2 className="text-2xl md:text-[28px] font-bold text-[var(--color-text-primary)] text-center mb-12">
              {t("features.title")}
            </h2>
          </Section>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Section key={i}>
                <div className="bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 text-center h-full">
                  <div
                    className={`w-14 h-14 mx-auto mb-4 ${f.bgColor} ${f.textColor} rounded-[var(--radius-card)] flex items-center justify-center`}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1120px] mx-auto px-4 py-16 md:py-24">
        <Section>
          <h2 className="text-2xl md:text-[28px] font-bold text-[var(--color-text-primary)] text-center mb-12">
            {t("howItWorks.title")}
          </h2>
        </Section>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <Section key={i}>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-[28px] font-bold">
                  {step.number}
                </div>
                <div className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-tertiary)] flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-card)]">
        <div className="max-w-[1120px] mx-auto px-4 py-16 md:py-24 text-center">
          <Section>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3">
              {t("cta.title")}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <LocalizedLink
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm transition-colors"
            >
              {t("cta.button")}
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </LocalizedLink>
          </Section>
        </div>
      </section>
    </div>
  );
}
