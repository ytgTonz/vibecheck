import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveStream, Venue, useAuthStore, useSocket, recordVisitIntent, recordVisitArrival, VisitArrivalResponse } from '@vibecheck/shared';
import { QRModal } from './QRModal';

interface Props {
  stream: LiveStream;
  venue: Venue;
}

// Scoped to venue + stream to avoid collisions across nights/sessions
function intentKey(venueId: string, streamId: string) {
  return `visit_intent_${venueId}_${streamId}`;
}

export function LiveAttendanceBar({ stream, venue }: Props) {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);

  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(venue.intentCount ?? 0);
  const [arrivalCount, setArrivalCount] = useState(venue.arrivalCount ?? 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [qrData, setQrData] = useState<VisitArrivalResponse | null>(null);
  const [intentSubmitting, setIntentSubmitting] = useState(false);
  const [arrivalSubmitting, setArrivalSubmitting] = useState(false);
  const thankYouAnim = useRef(new Animated.Value(0)).current;

  // Restore pressed state from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(intentKey(venue.id, stream.id)).then((val) => {
      if (val) setIntentPressed(true);
    });
  }, [venue.id, stream.id]);

  // Real-time count updates via Socket.IO
  useSocket({
    'attendance:update': (data) => {
      if (data.streamId === stream.id) {
        setIntentCount(data.intentCount);
        setArrivalCount(data.arrivalCount);
      }
    },
  });

  const handleIntent = async () => {
    if (intentPressed || intentSubmitting || !token) return;
    setIntentSubmitting(true);
    try {
      await recordVisitIntent({ venueId: venue.id, streamId: stream.id }, token);
      setIntentPressed(true);
      await AsyncStorage.setItem(intentKey(venue.id, stream.id), '1');
      setIntentCount((c) => c + 1);
    } catch {
      // Count may still update via socket if another device already recorded intent
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
      setShowThankYou(true);
      Animated.sequence([
        Animated.timing(thankYouAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(thankYouAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowThankYou(false));
    } catch {
      // Leave the button enabled so the user can retry after verification or recovery
    } finally {
      setArrivalSubmitting(false);
    }
  };

  return (
    <>
      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        className="px-4 pt-2"
      >
        {/* Live counters */}
        <View className="mb-2 items-center">
          <View className="flex-row items-center gap-2 rounded-full bg-black/50 px-4 py-1">
            <SymbolView name="calendar" size={11} tintColor="white" />
            <Text className="text-xs font-semibold text-white">{intentCount}</Text>
            <Text className="text-xs text-white/50">·</Text>
            <SymbolView name="mappin" size={11} tintColor="white" />
            <Text className="text-xs font-semibold text-white">{arrivalCount}</Text>
          </View>
        </View>

        {/* Thank you message */}
        {showThankYou && (
          <Animated.View
            className="mb-2 items-center"
            style={{ opacity: thankYouAnim, transform: [{ translateY: thankYouAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}
          >
            <Text className="text-xs font-medium text-white/80">
              Thank you from VibeCheck!
            </Text>
          </Animated.View>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Pressable
            onPress={handleIntent}
            disabled={intentPressed || intentSubmitting || !token}
            className={`flex-1 items-center rounded-xl py-3 ${
              intentPressed ? 'bg-white/20' : 'border border-orange-100/70 bg-white/90'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                intentPressed ? 'text-white/40' : 'text-black'
              }`}
            >
              {intentPressed ? "I'm Coming ✓" : "I'm Coming"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleArrival}
            disabled={arrivalPressed || arrivalSubmitting || !token}
            className={`flex-1 items-center rounded-xl py-3 ${
              arrivalPressed ? 'bg-purple-500/40' : 'bg-purple-500'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                arrivalPressed ? 'text-white/50' : 'text-white'
              }`}
            >
              {arrivalPressed ? "I'm Here ✓" : "I'm Here"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* QR modal — shown after "I'm Here" */}
      {qrData && (
        <QRModal
          visible={true}
          qrToken={qrData.qrToken}
          expiresAt={qrData.expiresAt}
          incentive={qrData.incentive}
          onClose={() => setQrData(null)}
        />
      )}
    </>
  );
}
