export enum VenueType {
  NIGHTCLUB = 'NIGHTCLUB',
  BAR = 'BAR',
  RESTAURANT_BAR = 'RESTAURANT_BAR',
  LOUNGE = 'LOUNGE',
  SHISA_NYAMA = 'SHISA_NYAMA',
  ROOFTOP = 'ROOFTOP',
  OTHER = 'OTHER',
}

export enum UserRole {
  VENUE_PROMOTER = 'VENUE_PROMOTER',
  VENUE_OWNER = 'VENUE_OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export enum FeedbackCategory {
  BUG = 'BUG',
  SUGGESTION = 'SUGGESTION',
  GENERAL = 'GENERAL',
}

export enum FeedbackRating {
  BAD = 'BAD',
  NEUTRAL = 'NEUTRAL',
  GOOD = 'GOOD',
}

export enum StreamStatus {
  IDLE = 'IDLE',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
}
