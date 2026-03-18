import { VenueType, UserRole } from './enums';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  location: string;
  city: string;
  hours: string | null;
  musicGenre: string[];
  claimedBy: string | null;
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
