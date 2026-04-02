import { Text, View } from 'react-native';
import { Venue, venueTypeLabel } from '@vibecheck/shared';

interface VenueInfoCardProps {
  venue: Venue;
  isOwner: boolean;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-3.5 border-b border-zinc-800">
      <Text className="text-sm text-zinc-500">{label}</Text>
      <Text className="text-sm text-zinc-200 text-right flex-1 ml-6">{value}</Text>
    </View>
  );
}

export function VenueInfoCard({ venue, isOwner }: VenueInfoCardProps) {
  return (
    <View className="mb-5 rounded-[24px] border border-zinc-800 bg-zinc-900 px-5 py-6">
      <Text className="text-[26px] font-semibold text-zinc-100 leading-tight">{venue.name}</Text>

      <View className="flex-row gap-2 flex-wrap mt-3 mb-4">
        <View className="bg-zinc-700 rounded-lg px-3 py-1.5 self-start">
          <Text className="text-xs text-zinc-300 uppercase tracking-[1px]">
            {venueTypeLabel[venue.type] ?? venue.type}
          </Text>
        </View>
        {isOwner && (
          <View className="bg-emerald-500/15 rounded-lg px-3 py-1.5 self-start">
            <Text className="text-xs font-medium text-emerald-300">You own this venue</Text>
          </View>
        )}
      </View>

      <View className="border-t border-zinc-800">
        <InfoRow label="Location" value={venue.location} />
        {venue.hours && <InfoRow label="Hours" value={venue.hours} />}
        {venue.musicGenre.length > 0 && (
          <InfoRow label="Music" value={venue.musicGenre.join(', ')} />
        )}
        {venue.coverCharge && <InfoRow label="Cover" value={venue.coverCharge} />}
        {venue.drinkPrices && (
          <View className="flex-row justify-between py-3.5">
            <Text className="text-sm text-zinc-500">Drinks</Text>
            <Text className="text-sm text-zinc-200">{venue.drinkPrices}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
