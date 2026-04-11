import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation("landing");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
        {t("about.title")}
      </h1>

      <div className="space-y-8">
        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8">
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {t("about.story")}
          </p>
        </div>

        <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
            {t("about.vision_title")}
          </h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {t("about.vision")}
          </p>
        </div>
      </div>
    </div>
  );
}
