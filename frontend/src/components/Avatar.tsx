interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: { container: "w-6 h-6", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-16 h-16", text: "text-xl" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const s = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${s.container} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${s.container} rounded-full bg-primary-100 text-primary-700 flex items-center justify-center ${s.text} font-semibold shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
