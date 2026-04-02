"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VenueWithStats, VenuePromoter, Invite, LiveStream, User, fetchVenueVisitStats, VisitStatsResponse } from "@vibecheck/shared";
import StreamFunnelCard from "@/components/StreamFunnelCard";
import { PromoterPanel } from "./PromoterPanel";
import { IncentivePanel } from "./IncentivePanel";

interface VenueStreamCardProps {
  venue: VenueWithStats;
  user: User | null;
  token: string;
  isOwner: boolean;
  recentStreams: LiveStream[];
  loadingStreams: boolean;
  promoters: VenuePromoter[] | undefined;
  invite: Invite | undefined;
  loadingPromoters: boolean;
  onLoadPromoters: () => void;
  onGenerateInvite: () => void;
  onRemovePromoter: (userId: string) => void;
}

export function VenueStreamCard({
  venue, user, token, isOwner,
  recentStreams, loadingStreams,
  promoters, invite, loadingPromoters,
  onLoadPromoters, onGenerateInvite, onRemovePromoter,
}: VenueStreamCardProps) {
  const [stats, setStats] = useState<VisitStatsResponse | null>(null);

  useEffect(() => {
    fetchVenueVisitStats(venue.id, token)
      .then(setStats)
      .catch(() => setStats(null));
  }, [venue.id, token]);

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold">{venue.name}</h2>
            <p className="text-sm text-zinc-400">{venue.location}</p>
          </div>
          {venue.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/20 px-2.5 py-1 text-xs font-semibold text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
              LIVE · {venue.currentViewerCount} viewers
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:gap-3">
          {venue.isLive ? (
            <Link href={`/dashboard/live/${venue.id}`} className="rounded-lg bg-brand-red/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30">
              View Stream
            </Link>
          ) : (
            <Link href={`/dashboard/live/${venue.id}`} className="rounded-lg bg-brand-red px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-red/90">
              Go Live
            </Link>
          )}
          <Link href={`/dashboard/scan/${venue.id}`} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
            Scan QR
          </Link>
          {venue.ownerId === user?.id && (
            <Link href={`/dashboard/edit/${venue.id}`} className="text-sm text-zinc-400 hover:text-white">
              Edit
            </Link>
          )}
          <Link href={`/venues/${venue.id}`} className="text-sm text-zinc-400 hover:text-white">
            View &rarr;
          </Link>
        </div>
      </div>

      {/* Visit stats */}
      {stats && (
        <div className="mb-4 flex gap-4 rounded-lg bg-zinc-800/40 px-4 py-3">
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-100">{stats.comingCount}</p>
            <p className="text-xs text-zinc-500">Coming</p>
          </div>
          <div className="w-px bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-100">{stats.arrivedCount}</p>
            <p className="text-xs text-zinc-500">Arrived</p>
          </div>
          <div className="w-px bg-zinc-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-100">{stats.claimedCount}</p>
            <p className="text-xs text-zinc-500">Claimed</p>
          </div>
        </div>
      )}

      {!venue.isLive && (
        <Link
          href={`/dashboard/live/${venue.id}`}
          className="mb-6 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 transition-colors hover:border-brand-red/30 hover:bg-brand-red/10"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red/20">
            <svg className="ml-0.5 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-200">Start a live stream</p>
            <p className="text-xs text-zinc-500">Broadcast to your audience in real time</p>
          </div>
        </Link>
      )}

      <StreamFunnelCard streams={recentStreams} loading={loadingStreams} />

      {isOwner && venue.ownerId === user?.id && (
        <PromoterPanel
          promoters={promoters}
          invite={invite}
          loading={loadingPromoters}
          onLoad={onLoadPromoters}
          onGenerateInvite={onGenerateInvite}
          onRemovePromoter={onRemovePromoter}
        />
      )}

      {isOwner && venue.ownerId === user?.id && (
        <IncentivePanel venueId={venue.id} token={token} />
      )}
    </div>
  );
}
