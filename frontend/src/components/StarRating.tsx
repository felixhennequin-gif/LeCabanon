import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export function StarRating({ rating, onChange, size = 20 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`bg-transparent border-none p-0 ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={star <= rating ? "fill-warm-500 text-warm-500" : "text-slate-300 dark:text-slate-600"}
          />
        </button>
      ))}
    </div>
  );
}
