import { useTranslation } from "react-i18next";
import { Wrench, Users, MessageCircle } from "lucide-react";

export function FeaturesPage() {
  const { t } = useTranslation("landing");

  const features = [
    {
      icon: <Wrench className="w-10 h-10" strokeWidth={1.5} />,
      title: t("features.equipment.title"),
      description: t("features.equipment.description"),
    },
    {
      icon: <Users className="w-10 h-10" strokeWidth={1.5} />,
      title: t("features.artisans.title"),
      description: t("features.artisans.description"),
    },
    {
      icon: <MessageCircle className="w-10 h-10" strokeWidth={1.5} />,
      title: t("features.messaging.title"),
      description: t("features.messaging.description"),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">
        {t("features.title")}
      </h1>
      <div className="space-y-12">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-8 flex flex-col sm:flex-row items-start gap-6"
          >
            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-[var(--radius-card)] flex items-center justify-center shrink-0">
              {f.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{f.title}</h2>
              <p className="text-[var(--color-text-secondary)]">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
