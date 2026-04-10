import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatRelativeDate } from "../lib/date";
import { StarRating } from "./StarRating";
import { Package, HardHat, UserPlus, Star, Trash2, Rss } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; photo?: string | null };
  equipment?: { id: string; name: string; category: string; photos: string[] } | null;
  artisan?: { id: string; name: string; category: string; company?: string | null } | null;
  review?: { id: string; rating: number; comment?: string | null; artisan: { id: string; name: string } | null } | null;
}

interface FeedResponse {
  activities: Activity[];
  nextCursor: string | null;
}

function Avatar({ firstName, lastName, id }: { firstName: string; lastName: string; id: string }) {
  return (
    <Link
      to={`/users/${id}`}
      className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium shrink-0 no-underline"
    >
      {firstName[0]}{lastName[0]}
    </Link>
  );
}

function ActorLink({ actor }: { actor: Activity["actor"] }) {
  return (
    <Link to={`/users/${actor.id}`} className="font-medium text-slate-900 dark:text-slate-100 no-underline hover:underline">
      {actor.firstName} {actor.lastName}
    </Link>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">{category}</span>;
}

function ActivityIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  switch (type) {
    case "MEMBER_JOINED": return <UserPlus className={`${cls} text-green-500`} />;
    case "EQUIPMENT_ADDED": return <Package className={`${cls} text-blue-500`} />;
    case "EQUIPMENT_REMOVED": return <Trash2 className={`${cls} text-slate-400`} />;
    case "ARTISAN_ADDED": return <HardHat className={`${cls} text-purple-500`} />;
    case "ARTISAN_REMOVED": return <Trash2 className={`${cls} text-slate-400`} />;
    case "REVIEW_ADDED": return <Star className={`${cls} text-warm-500`} />;
    default: return null;
  }
}

function ActivityCard({ activity }: { activity: Activity }) {
  const { type, actor, equipment, artisan, review, createdAt } = activity;
  const isRemoval = type === "EQUIPMENT_REMOVED" || type === "ARTISAN_REMOVED";

  return (
    <div className={`flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ${isRemoval ? "opacity-60" : ""}`}>
      <Avatar firstName={actor.firstName} lastName={actor.lastName} id={actor.id} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm">
            <ActivityContent type={type} actor={actor} equipment={equipment} artisan={artisan} review={review} />
          </p>
          <ActivityIcon type={type} />
        </div>

        {type === "REVIEW_ADDED" && review && (
          <div className="mt-1.5">
            <StarRating rating={review.rating} size={14} />
            {review.comment && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{review.comment}</p>
            )}
          </div>
        )}

        {type === "EQUIPMENT_ADDED" && equipment && (
          <div className="mt-1.5">
            <CategoryBadge category={equipment.category} />
          </div>
        )}

        {type === "ARTISAN_ADDED" && artisan && (
          <div className="mt-1.5">
            <CategoryBadge category={artisan.category} />
          </div>
        )}

        <p className="text-xs text-slate-400 mt-1.5">{formatRelativeDate(createdAt)}</p>
      </div>
    </div>
  );
}

function ActivityContent({ type, actor, equipment, artisan, review }: {
  type: string;
  actor: Activity["actor"];
  equipment: Activity["equipment"];
  artisan: Activity["artisan"];
  review: Activity["review"];
}) {
  switch (type) {
    case "MEMBER_JOINED":
      return <><ActorLink actor={actor} />{" "}a rejoint la communauté</>;

    case "EQUIPMENT_ADDED":
      return (
        <>
          <ActorLink actor={actor} />{" "}a ajouté du matériel :{" "}
          <span className="font-medium">{equipment?.name ?? "Élément supprimé"}</span>
        </>
      );

    case "EQUIPMENT_REMOVED":
      return (
        <>
          <ActorLink actor={actor} />{" "}a retiré du matériel :{" "}
          <span className="font-medium">{equipment?.name ?? "Élément supprimé"}</span>
        </>
      );

    case "ARTISAN_ADDED":
      return (
        <>
          <ActorLink actor={actor} />{" "}a recommandé un artisan :{" "}
          {artisan ? (
            <Link to={`/artisans/${artisan.id}`} className="font-medium text-primary-600 no-underline hover:underline">
              {artisan.company || artisan.name}
            </Link>
          ) : (
            <span className="font-medium text-slate-400">Artisan supprimé</span>
          )}
        </>
      );

    case "ARTISAN_REMOVED":
      return (
        <>
          <ActorLink actor={actor} />{" "}a retiré un artisan :{" "}
          <span className="font-medium">{artisan?.company || artisan?.name || "Artisan supprimé"}</span>
        </>
      );

    case "REVIEW_ADDED": {
      const artisanName = review?.artisan?.name ?? artisan?.name ?? "Artisan supprimé";
      const artisanId = review?.artisan?.id ?? artisan?.id;
      return (
        <>
          <ActorLink actor={actor} />{" "}a laissé un avis sur{" "}
          {artisanId ? (
            <Link to={`/artisans/${artisanId}`} className="font-medium text-primary-600 no-underline hover:underline">
              {artisanName}
            </Link>
          ) : (
            <span className="font-medium text-slate-400">{artisanName}</span>
          )}
        </>
      );
    }

    default:
      return <><ActorLink actor={actor} />{" "}a effectué une action</>;
  }
}

export function FeedList({ communityId }: { communityId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (cursor) params.set("cursor", cursor);
    const data = await api<FeedResponse>(`/communities/${communityId}/feed?${params}`);
    return data;
  }, [communityId]);

  useEffect(() => {
    setLoading(true);
    loadFeed().then((data) => {
      setActivities(data.activities);
      setNextCursor(data.nextCursor);
    }).finally(() => setLoading(false));
  }, [loadFeed]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await loadFeed(nextCursor);
      setActivities((prev) => [...prev, ...data.activities]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Rss className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium">Rien de nouveau pour le moment</p>
        <p className="text-sm mt-1">Ajoutez du matériel ou recommandez un artisan pour lancer la communauté !</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <ActivityCard key={a.id} activity={a} />
      ))}
      {nextCursor && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer disabled:opacity-50 bg-white dark:bg-slate-900"
          >
            {loadingMore ? "Chargement..." : "Charger plus"}
          </button>
        </div>
      )}
    </div>
  );
}
