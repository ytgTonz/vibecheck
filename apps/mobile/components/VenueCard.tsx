import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Venue } from '@vibecheck/shared';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

const venueTypeAccent: Record<string, string> = {
  NIGHTCLUB: 'bg-fuchsia-400',
  BAR: 'bg-amber-400',
  RESTAURANT_BAR: 'bg-orange-300',
  LOUNGE: 'bg-cyan-400',
  SHISA_NYAMA: 'bg-red-400',
  ROOFTOP: 'bg-sky-400',
  OTHER: 'bg-zinc-400',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function storyStatus(lastClipAt: string | null) {
  if (!lastClipAt) {
    return {
      label: 'Quiet feed',
      detail: 'No recent clip yet',
    };
  }

  const diffMs = Date.now() - new Date(lastClipAt).getTime();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 2) {
    return {
      label: 'Live now',
      detail: `Updated ${timeAgo(lastClipAt)}`,
    };
  }

  if (hours < 24) {
    return {
      label: 'Fresh clip',
      detail: `Updated ${timeAgo(lastClipAt)}`,
    };
  }

  return {
    label: 'Catch up',
    detail: `Last clip ${timeAgo(lastClipAt)}`,
  };
}

export default function VenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const status = storyStatus(venue.lastClipAt);
  const storyBarCount = venue.clipCount > 0 ? Math.min(venue.clipCount, 5) : 1;
  const accent = venueTypeAccent[venue.type] ?? venueTypeAccent.OTHER;
  const hasThumbnail = !!venue.latestClipThumbnail;
  const compactMeta = [
    venue.location,
    venue.clipCount > 0
      ? `${venue.clipCount} ${venue.clipCount === 1 ? 'clip' : 'clips'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/venues/[id]',
          params: { id: venue.id },
        })
      }
      className="mb-3 overflow-hidden rounded-[22px] border border-zinc-800 bg-zinc-950 px-4 py-3 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 22,
        elevation: 4,
      }}
    >
      {hasThumbnail ? (
        <Image
          source={{ uri: venue.latestClipThumbnail! }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
      ) : null}

      <View
        className={`absolute inset-0 ${
          hasThumbnail ? 'bg-black/55' : 'bg-zinc-950'
        }`}
      />

      <View className="relative mb-3 flex-row gap-1.5">
        {Array.from({ length: storyBarCount }).map((_, index) => (
          <View
            key={index}
            className={`h-1 flex-1 rounded-full ${
              venue.clipCount === 0
                ? 'bg-zinc-800'
                : index === 0
                  ? 'bg-zinc-100'
                  : 'bg-zinc-700'
            }`}
          />
        ))}
      </View>

      <View className="relative">
        <View className="flex-row items-center gap-2">
          <View className={`h-2.5 w-2.5 rounded-full ${accent}`} />
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-300">
            {status.label}
          </Text>
          <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-500">
            {venueTypeLabel[venue.type] ?? venue.type}
          </Text>
        </View>

        <Text className="mt-2 text-lg font-semibold text-zinc-100">
          {venue.name}
        </Text>
      </View>

      <Text className="relative mt-2 text-sm text-zinc-300">
        {compactMeta || venue.location}
      </Text>

      <View className="relative mt-3 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-zinc-900 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-200">
            {status.detail}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
