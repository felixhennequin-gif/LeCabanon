import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "../../components/SEO";

interface SitePageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export function SitePageView({ slug: slugProp }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugProp || params.slug;
  const { t } = useTranslation("common");
  const seoKey = slug === "cgu" ? "terms" : slug === "mentions-legales" ? "legal" : null;

  const [state, setState] = useState<{
    slug: string | undefined;
    page: SitePageData | null;
    loading: boolean;
    error: boolean;
  }>({ slug, page: null, loading: true, error: false });

  if (state.slug !== slug) {
    setState({ slug, page: null, loading: true, error: false });
  }

  const { page, loading, error } = state;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/pages/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled)
          setState({ slug, page: data, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled)
          setState({ slug, page: null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-input)] rounded-[var(--radius-input)] w-2/3" />
          <div className="h-4 bg-[var(--color-input)] rounded-[var(--radius-input)] w-full" />
          <div className="h-4 bg-[var(--color-input)] rounded-[var(--radius-input)] w-5/6" />
          <div className="h-4 bg-[var(--color-input)] rounded-[var(--radius-input)] w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Page introuvable
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          La page demandée n'existe pas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {seoKey && (
        <SEO
          title={t(`seo.${seoKey}.title`)}
          description={t(`seo.${seoKey}.description`)}
        />
      )}
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-8">
        {page.title}
      </h1>
      <div
        className="site-page-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
