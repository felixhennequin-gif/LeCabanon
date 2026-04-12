import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { SEO } from "../../components/SEO";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const { t } = useTranslation("common");
  const [introHtml, setIntroHtml] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    fetch("/api/pages/contact")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) setIntroHtml(data.content);
      })
      .catch(() => {});
  }, []);

  async function onSubmit(data: ContactFormData) {
    setSubmitError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        throw new Error(err.error);
      }
      setSuccess(true);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t("contact.error")
      );
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <SEO title={t("seo.contact.title")} description={t("seo.contact.description")} />
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">
        Contact
      </h1>

      {introHtml && (
        <div
          className="site-page-content mb-8"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      )}

      {success && (
        <div className="bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] px-4 py-3 rounded-[var(--radius-input)] text-sm mb-6">
          {t("contact.success")}
        </div>
      )}

      {submitError && (
        <div className="bg-[var(--color-error-light)] text-[var(--color-error)] px-4 py-3 rounded-[var(--radius-input)] text-sm mb-6">
          {submitError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[var(--color-card)] p-6 rounded-[var(--radius-card)] border border-[var(--color-border)] space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {t("contact.name")}
          </label>
          <input
            type="text"
            {...register("name")}
            placeholder={t("contact.name_placeholder")}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
          />
          {errors.name && (
            <p className="text-[var(--color-error)] text-xs mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {t("contact.email")}
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder={t("contact.email_placeholder")}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)]"
          />
          {errors.email && (
            <p className="text-[var(--color-error)] text-xs mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            {t("contact.message")}
          </label>
          <textarea
            {...register("message")}
            rows={6}
            placeholder={t("contact.message_placeholder")}
            className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-[var(--color-input)] text-[var(--color-text-primary)] resize-vertical"
          />
          {errors.message && (
            <p className="text-[var(--color-error)] text-xs mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-primary-600 text-[var(--color-page)] px-6 py-2.5 rounded-[var(--radius-button)] font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" strokeWidth={1.5} />
          {isSubmitting ? t("actions.loading") : t("contact.submit")}
        </button>
      </form>
    </div>
  );
}
