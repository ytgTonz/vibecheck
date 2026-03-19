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

function storyStatusLabel(lastClipAt: string | null): string {
  if (!lastClipAt) return 'Quiet feed';
  const hours = (Date.now() - new Date(lastClipAt).getTime()) / (1000 * 60 * 60);
  if (hours < 2) return 'Live now';
  if (hours < 24) return 'Fresh clip';
  return 'Catch up';
}

export default function FeaturedVenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const status = storyStatusLabel(venue.lastClipAt);
  const hasThumbnail = !!venue.latestClipThumbnail;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/venues/[id]',
          params: { id: venue.id },
        })
      }
      className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 34,
        elevation: 8,
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

      <View className="relative min-h-[260px] justify-end p-5">
        <View className="mb-4 flex-row flex-wrap items-center gap-2">
          <View
            className={`h-2.5 w-2.5 rounded-full ${
              status === 'Live now'
                ? 'bg-emerald-400'
                : status === 'Fresh clip'
                  ? 'bg-amber-400'
                  : 'bg-zinc-500'
            }`}
          />
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-300">
            {status}
          </Text>
          <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
            <Text className="text-xs font-medium text-zinc-300">
              {venueTypeLabel[venue.type] ?? venue.type}
            </Text>
          </View>
        </View>

        <Text className="text-3xl font-semibold text-zinc-100">
          {venue.name}
        </Text>
        <Text className="mt-2 text-sm text-zinc-300">{venue.location}</Text>

        {venue.latestClipCaption && (
          <Text className="mt-4 text-sm leading-6 text-zinc-300">
            "{venue.latestClipCaption}"
          </Text>
        )}

        <View className="mt-5 flex-row items-center justify-between">
          <View className="rounded-full bg-zinc-100 px-5 py-3">
            <Text className="text-sm font-semibold text-zinc-950">Watch now</Text>
          </View>
          {venue.latestClipViews != null && venue.latestClipViews > 0 ? (
            <Text className="text-xs text-zinc-400">
              {venue.latestClipViews.toLocaleString()} views
            </Text>
          ) : (
            <Text className="text-xs text-zinc-500">Open venue story</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
