import { VenueType, UserRole } from './enums';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  coverCharge: string | null;
  drinkPrices: string | null;
  ownerId: string;
  createdAt: string; // ISO date string (JSON serialised from Date)
  updatedAt: string;
  lastClipAt: string | null; // most recent clip timestamp (from GET /venues)
}

export interface Clip {
  id: string;
  videoUrl: string;
  thumbnail: string | null;
  duration: number;
  venueId: string;
  uploadedBy: string;
  musicGenre: string | null;
  caption: string | null;
  views: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VenuePromoter {
  id: string;
  userId: string;
  venueId: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface Invite {
  id: string;
  code: string;
  venueId: string;
  createdBy: string;
  used: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}
