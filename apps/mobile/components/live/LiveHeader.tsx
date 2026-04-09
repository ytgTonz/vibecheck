import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Venue, type VisitArrivalResponse } from '@vibecheck/shared';
import { compactNumber } from '@/lib/format';
import { QRModal } from './QRModal';

function arrivalQrKey(venueId: string, streamId: string) {
  return `visit_arrival_qr_${venueId}_${streamId}`;
}

export function LiveHeader({
  venue,
  viewerCount,
  streamId,
}: {
  venue: Venue;
  viewerCount: number;
  streamId: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [qrData, setQrData] = useState<VisitArrivalResponse | null>(null);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(arrivalQrKey(venue.id, streamId))
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as VisitArrivalResponse;
        if (!parsed?.qrToken || !parsed?.expiresAt) return;
        if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
          AsyncStorage.removeItem(arrivalQrKey(venue.id, streamId)).catch(() => {});
          return;
        }
        setQrData(parsed);
      })
      .catch(() => {});
  }, [venue.id, streamId]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: venue.name,
        message: `Watch ${venue.name} live on VibeCheck`,
      });
    } catch {
      // user cancelled or share not available
    }
  };

  const handleClose = () => {
    router.replace({ pathname: '/venues/[id]', params: { id: venue.id } });
  };

  return (
    <View
      className="absolute left-0 right-0 top-0 z-10 px-4"
      style={{ paddingTop: Math.max(insets.top, 8), paddingBottom: 10 }}
    >
      {/* Single top bar: left action + centered header + right actions */}
      <View className="flex-row items-center">
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
        >
          <Ionicons name="chevron-down" size={22} color="white" />
        </Pressable>

        {/* Center header block */}
        <View className="min-w-0 flex-1 items-center px-3">
          <View className="flex-row items-center gap-2">
            {/* LIVE pill */}
            <View className="flex-row items-center gap-1.5 rounded-full bg-brand-red px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-white opacity-90" />
              <Text className="text-xs font-bold text-white">LIVE</Text>
            </View>

            <View className="min-w-0 flex-row items-center gap-1.5">
              <Text className="max-w-[170px] text-sm font-bold text-white" numberOfLines={1}>
                {venue.name}
              </Text>
              <View className="h-4 w-4 items-center justify-center rounded-full bg-brand-red">
                <Ionicons name="checkmark" size={10} color="white" />
              </View>
            </View>
          </View>

          <View className="mt-0.5 flex-row items-center gap-1">
            <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.6)" />
            <Text className="text-xs text-white/60">{compactNumber(viewerCount)} watching</Text>
          </View>
        </View>

        {/* Right actions */}
        <View className="flex-row items-center gap-2">
          {!!qrData && (
            <Pressable
              onPress={() => setQrVisible(true)}
              hitSlop={12}
              className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
            >
              <Ionicons name="qr-code-outline" size={19} color="white" />
            </Pressable>
          )}
          <Pressable
            onPress={handleShare}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
          >
            <Ionicons name="share-outline" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {qrData && (
        <QRModal
          visible={qrVisible}
          qrToken={qrData.qrToken}
          expiresAt={qrData.expiresAt}
          incentive={qrData.incentive}
          onClose={() => setQrVisible(false)}
        />
      )}
    </View>
  );
}
