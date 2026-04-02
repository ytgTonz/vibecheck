/**
 * Shared validation constants.
 *
 * Centralised here so that route files (feedback, admin, etc.) reference the
 * same source of truth. Adding a new category or rating only requires a
 * single change.
 */

export const VALID_CATEGORIES = ['BUG', 'SUGGESTION', 'GENERAL'] as const;
export const VALID_RATINGS = ['BAD', 'NEUTRAL', 'GOOD'] as const;
export const VALID_ROLES = ['ADMIN', 'VENUE_OWNER', 'VENUE_PROMOTER'] as const;
export const VALID_VENUE_TYPES = ['NIGHTCLUB', 'BAR', 'RESTAURANT_BAR', 'LOUNGE', 'SHISA_NYAMA', 'ROOFTOP', 'OTHER'] as const;
