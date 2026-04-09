import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { ExternalLink } from "lucide-react";

interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

function LinkPreviewInner({ url }: { url: string }) {
  const [data, setData] = useState<OgData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<OgData>(`/opengraph?url=${encodeURIComponent(url)}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData({ url, title: null, description: null, image: null, siteName: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4 flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!data || (!data.title && !data.description && !data.image)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline no-underline"
      >
        <ExternalLink className="w-4 h-4" />
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-primary-300 transition-colors no-underline"
    >
      <div className="flex">
        {data.image && (
          <div className="w-24 h-24 shrink-0 bg-gray-200">
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="p-3 min-w-0 flex-1">
          {data.siteName && <p className="text-xs text-gray-400 mb-0.5">{data.siteName}</p>}
          {data.title && <p className="text-sm font-medium text-gray-900 truncate">{data.title}</p>}
          {data.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {data.description.length > 150 ? data.description.slice(0, 150) + "…" : data.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

// Key wrapper ensures full remount when URL changes, avoiding setState-in-effect issues
export function LinkPreview({ url }: { url: string }) {
  return <LinkPreviewInner key={url} url={url} />;
}
