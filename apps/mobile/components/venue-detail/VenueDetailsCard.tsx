import { Text, View } from 'react-native';
import { Venue } from '@vibecheck/shared';

interface VenueDetailsCardProps {
  venue: Venue;
}

export function VenueDetailsCard({ venue }: VenueDetailsCardProps) {
  return (
    <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
      <Text className="text-xl font-semibold text-zinc-100">Venue details</Text>
      <Text className="mt-1 text-sm text-zinc-400">The practical stuff for planning your night.</Text>

      <View className="mt-5 gap-4">
        <View>
          <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">Location</Text>
          <Text className="mt-1 text-base text-zinc-100">{venue.location}</Text>
        </View>

        {venue.hours && (
          <View>
            <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">Hours</Text>
            <Text className="mt-1 text-base text-zinc-100">{venue.hours}</Text>
          </View>
        )}

        {venue.coverCharge && (
          <View>
            <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">Cover</Text>
            <Text className="mt-1 text-base text-zinc-100">{venue.coverCharge}</Text>
          </View>
        )}

        {venue.drinkPrices && (
          <View>
            <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">Drinks</Text>
            <Text className="mt-1 text-base text-zinc-100">{venue.drinkPrices}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
