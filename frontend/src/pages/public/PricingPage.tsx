import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../../components/LocalizedLink";
import { useInView } from "../../hooks/useInView";
import { Check, ChevronDown } from "lucide-react";

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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-transparent border-none cursor-pointer"
      >
        <span className="text-sm font-medium text-[var(--color-text-primary)] pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-tertiary)] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed m-0">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function PricingPage() {
  const { t } = useTranslation("landing");

  const freeFeatures = t("pricing.free.features", { returnObjects: true }) as string[];
  const faqItems = t("pricing.faq.items", { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-4 py-16 md:py-20 text-center">
        <Section>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-3">
            {t("pricing.title")}
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            {t("pricing.subtitle")}
          </p>
        </Section>
      </section>

      {/* Pricing cards */}
      <section className="max-w-[1120px] mx-auto px-4 pb-16 md:pb-20">
        <Section>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free tier */}
            <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border-2 border-primary-400 p-8">
              <span className="inline-block text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-600 rounded-[var(--radius-pill)]">
                {t("pricing.free.badge")}
              </span>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mt-4">
                {t("pricing.free.name")}
              </h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  {t("pricing.free.price")}
                </span>
                <span className="text-sm text-[var(--color-text-tertiary)]">
                  {t("pricing.free.period")}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("pricing.free.description")}
              </p>

              <ul className="mt-6 space-y-3">
                {freeFeatures.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]"
                  >
                    <Check
                      className="w-4 h-4 text-primary-600 shrink-0"
                      strokeWidth={1.5}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <LocalizedLink
                to="/register"
                className="block mt-8 text-center px-6 py-2.5 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] font-medium hover:bg-primary-700 no-underline text-sm transition-colors"
              >
                {t("pricing.free.cta")}
              </LocalizedLink>
            </div>

            {/* Pro placeholder */}
            <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 opacity-70">
              <span className="inline-block text-xs font-semibold px-3 py-1 bg-warm-50 text-warm-600 rounded-[var(--radius-pill)]">
                {t("pricing.pro.badge")}
              </span>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mt-4">
                {t("pricing.pro.name")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-4 leading-relaxed">
                {t("pricing.pro.description")}
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-6">
                {t("pricing.pro.contact")}
              </p>
            </div>
          </div>
        </Section>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-card)] border-t border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-16 md:py-20">
          <Section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-8">
              {t("pricing.faq.title")}
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </Section>
        </div>
      </section>
    </div>
  );
}
