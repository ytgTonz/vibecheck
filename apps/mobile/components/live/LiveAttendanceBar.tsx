import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveStream, Venue, useAuthStore, useSocket, recordVisitIntent, recordVisitArrival, VisitArrivalResponse } from '@vibecheck/shared';
import { QRModal } from './QRModal';

interface Props {
  stream: LiveStream;
  venue: Venue;
  bottomOffset: number;
}

function intentKey(venueId: string, streamId: string) {
  return `visit_intent_${venueId}_${streamId}`;
}

function arrivalQrKey(venueId: string, streamId: string) {
  return `visit_arrival_qr_${venueId}_${streamId}`;
}

export function LiveAttendanceBar({ stream, venue, bottomOffset }: Props) {
  const token = useAuthStore((s) => s.token);

  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(venue.intentCount ?? 0);
  const [arrivalCount, setArrivalCount] = useState(venue.arrivalCount ?? 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [qrData, setQrData] = useState<VisitArrivalResponse | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [intentSubmitting, setIntentSubmitting] = useState(false);
  const [arrivalSubmitting, setArrivalSubmitting] = useState(false);
  const thankYouAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(intentKey(venue.id, stream.id))
      .then((val) => {
        if (val) setIntentPressed(true);
      })
      .catch(() => {});
  }, [venue.id, stream.id]);

  useEffect(() => {
    // Restore QR so users can find it after app relaunch.
    AsyncStorage.getItem(arrivalQrKey(venue.id, stream.id))
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as VisitArrivalResponse;
        if (!parsed?.qrToken || !parsed?.expiresAt) return;
        if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
          AsyncStorage.removeItem(arrivalQrKey(venue.id, stream.id)).catch(() => {});
          return;
        }
        setArrivalPressed(true);
        setQrData(parsed);
      })
      .catch(() => {});
  }, [venue.id, stream.id]);

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
    };
  }, []);

  useSocket({
    'attendance:update': (data) => {
      if (data.streamId !== stream.id) return;
      setIntentCount(data.intentCount);
      setArrivalCount(data.arrivalCount);
    },
  });

  const handleIntent = async () => {
    if (intentPressed || intentSubmitting || !token) return;
    setIntentSubmitting(true);
    try {
      await recordVisitIntent({ venueId: venue.id, streamId: stream.id }, token);
      setIntentPressed(true);
      setIntentCount((c) => c + 1);
      await AsyncStorage.setItem(intentKey(venue.id, stream.id), '1');
    } catch {
      // socket will update counts
    } finally {
      setIntentSubmitting(false);
    }
  };

  const handleArrival = async () => {
    if (arrivalPressed || arrivalSubmitting || !token) return;
    setArrivalSubmitting(true);
    try {
      const result = await recordVisitArrival({ venueId: venue.id, streamId: stream.id }, token);
      setArrivalPressed(true);
      setArrivalCount((c) => c + 1);
      setQrData(result);
      setQrVisible(true);
      await AsyncStorage.setItem(arrivalQrKey(venue.id, stream.id), JSON.stringify(result));
      setShowThankYou(true);
      const anim = Animated.sequence([
        Animated.timing(thankYouAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(thankYouAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      animationRef.current = anim;
      anim.start(() => setShowThankYou(false));
    } catch {
      // leave button enabled for retry
    } finally {
      setArrivalSubmitting(false);
    }
  };

  return (
    <>
      <View
        style={{ position: 'absolute', bottom: bottomOffset, left: 0, right: 0, zIndex: 25 }}
        className="flex-row items-center gap-3 bg-black/60 px-4 py-3"
      >
        {/* Label */}
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.5)" />
          <View className="min-w-0 flex-1">
            <Text className="text-xs font-semibold text-white" numberOfLines={1}>
              Planning to go out?
            </Text>
            {showThankYou ? (
              <Text className="text-xs text-white/50" numberOfLines={1}>
                Thank you from VibeCheck!
              </Text>
            ) : (
              <Text className="text-xs text-white/50" numberOfLines={1}>
                {intentCount} going · {arrivalCount} here
              </Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleIntent}
            disabled={intentPressed || intentSubmitting || !token}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
              intentPressed ? 'bg-white/10' : 'bg-zinc-800'
            }`}
          >
            <Text className="text-sm">🤔</Text>
            <Text className={`text-xs font-semibold ${intentPressed ? 'text-white/40' : 'text-white'}`}>
              {intentPressed ? 'Thinking ✓' : 'Thinking of going'}
            </Text>
          </Pressable>

          <Pressable
            onPress={arrivalPressed ? () => setQrVisible(true) : handleArrival}
            disabled={arrivalSubmitting || (!arrivalPressed && !token)}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
              arrivalPressed ? 'bg-brand-red/40' : 'bg-brand-red'
            }`}
          >
            <Text className="text-sm">🚶</Text>
            <Text className={`text-xs font-semibold ${arrivalPressed ? 'text-white/60' : 'text-white'}`}>
              {arrivalPressed ? 'Show QR' : "I'm here"}
            </Text>
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
    </>
  );
}
