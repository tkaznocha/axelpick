export default function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  gradient = false,
}: {
  avatarUrl?: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-14 w-14 text-xl",
  }[size];

  const initial = displayName.charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClasses} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
        gradient
          ? "aurora-gradient text-white"
          : "bg-black/5 text-text-secondary"
      }`}
    >
      {initial}
    </div>
  );
}
