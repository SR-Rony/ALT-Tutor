export function formatCoursePrice(price: number | string) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return "Free";
  return `৳${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatCourseLevel(level?: string | null) {
  if (!level) return "All levels";
  return level
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLessonDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export function averageReviewRating(ratings: number[]) {
  if (!ratings.length) return 0;
  return ratings.reduce((sum, n) => sum + n, 0) / ratings.length;
}
