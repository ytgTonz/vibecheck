import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisitArrivalResponse } from '@vibecheck/shared';
import { QRModal } from '../live/QRModal';

const QR_KEY_PREFIX = 'visit_arrival_qr_';

interface Props {
  venueId: string;
}

/**
 * Shows a "Your QR" card on the venue detail page when the user has a
 * saved, unexpired QR code for this venue — even after the stream ends.
 */
export function SavedQRCard({ venueId }: Props) {
  const [qrData, setQrData] = useState<VisitArrivalResponse | null>(null);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        // Find any QR keys for this venue (across all streams)
        const venueQrKeys = allKeys.filter(
          (key) => key.startsWith(`${QR_KEY_PREFIX}${venueId}_`),
        );

        if (venueQrKeys.length === 0) return;

        // Check each key for a valid, unexpired QR
        for (const key of venueQrKeys) {
          const raw = await AsyncStorage.getItem(key);
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw) as VisitArrivalResponse;
            if (!parsed?.qrToken || !parsed?.expiresAt) continue;

            if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
              // Clean up expired entries
              AsyncStorage.removeItem(key).catch(() => {});
              continue;
            }

            if (!cancelled) {
              setQrData(parsed);
              return; // Use the first valid one found
            }
          } catch {
            // Invalid JSON — remove stale entry
            AsyncStorage.removeItem(key).catch(() => {});
          }
        }
      } catch {
        // AsyncStorage read failure — nothing to show
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  if (!qrData) return null;

  return (
    <>
      <View className="mb-5 rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-red/20">
            <Ionicons name="qr-code-outline" size={20} color="#FF2D55" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-zinc-100">
              You have a check-in QR
            </Text>
            <Text className="text-xs text-zinc-500">
              Show this at the door to claim your perk
            </Text>
          </View>
          <Pressable
            onPress={() => setQrVisible(true)}
            className="rounded-2xl bg-brand-red px-4 py-2.5"
          >
            <Text className="text-xs font-semibold text-white">Show QR</Text>
          </Pressable>
        </View>
      </View>

      <QRModal
        visible={qrVisible}
        qrToken={qrData.qrToken}
        expiresAt={qrData.expiresAt}
        incentive={qrData.incentive}
        onClose={() => setQrVisible(false)}
      />
    </>
  );
}
