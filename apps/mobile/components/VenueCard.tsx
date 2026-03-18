import { Pressable, Text, View } from 'react-native';
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

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/venues/[id]',
          params: { id: venue.id },
        })
      }
      className="mb-4 overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 p-4 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 14 },
        shadowRadius: 30,
        elevation: 6,
      }}
    >
      <View className="mb-4 flex-row gap-1.5">
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

      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <View className={`h-2.5 w-2.5 rounded-full ${accent}`} />
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-400">
              {status.label}
            </Text>
          </View>

          <Text className="mt-3 text-xl font-semibold text-zinc-100">
            {venue.name}
          </Text>
        </View>

        <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-300">
            {venueTypeLabel[venue.type] ?? venue.type}
          </Text>
        </View>
      </View>

      <Text className="mb-4 text-sm leading-5 text-zinc-300">
        {venue.location}
      </Text>

      <View className="mb-4 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-zinc-900 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-200">
            {status.detail}
          </Text>
        </View>

        {venue.hours && (
          <View className="rounded-full bg-zinc-900 px-3 py-1">
            <Text className="text-xs font-medium text-zinc-200">
              {venue.hours}
            </Text>
          </View>
        )}

        <View className="rounded-full bg-zinc-900 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-200">
            {venue.clipCount} {venue.clipCount === 1 ? 'clip' : 'clips'}
          </Text>
        </View>
      </View>

      {venue.musicGenre.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {venue.musicGenre.slice(0, 3).map((genre) => (
            <View
              key={genre}
              className="rounded-full border border-zinc-800 px-3 py-1"
            >
              <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-300">
                {genre}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-sm text-zinc-200">Open venue story</Text>
        <View className="h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
          <Text className="ml-0.5 text-lg text-zinc-100">▶</Text>
        </View>
      </View>
    </Pressable>
  );
}
