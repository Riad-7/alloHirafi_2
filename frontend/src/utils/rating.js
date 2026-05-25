export function clampRating(value) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(5, numeric));
}

export function starsVisual(rating) {
  const clamped = clampRating(rating);
  const filled = Math.floor(clamped);
  return `${'\u2B50'.repeat(filled)}${'\u2606'.repeat(5 - filled)}`;
}

export function formatRatingValue(rating) {
  const clamped = clampRating(rating);
  const fixed = clamped.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
}

export function buildRatingSummary(artisan, fallbackName = '') {
  const summary = artisan?.rating_summary;
  if (summary) return summary;

  const reviewsCount = artisan?.reviews_count ?? artisan?.reviews?.length ?? 0;
  const average = clampRating(artisan?.average_rating ?? 0);
  const stars = starsVisual(average);
  const averageLabel = formatRatingValue(average);
  const noReviewsMessage = 'Aucune evaluation pour le moment';

  return {
    artisan_name: fallbackName,
    average_rating: average,
    reviews_count: reviewsCount,
    stars_visual: stars,
    display: reviewsCount === 0 ? noReviewsMessage : `${stars} (${averageLabel}/5)`,
    no_reviews_message: reviewsCount === 0 ? noReviewsMessage : null,
  };
}
