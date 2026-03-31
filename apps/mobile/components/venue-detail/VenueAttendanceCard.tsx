import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LiveStream, Venue, useAuthStore, useSocket, recordVisitIntent, recordVisitArrival, VisitArrivalResponse } from '@vibecheck/shared';
import { QRModal } from '../live/QRModal';

interface VenueAttendanceCardProps {
  stream: LiveStream;
  venue: Venue;
}

// Scoped to venue + stream to avoid collisions across nights/sessions
function intentKey(venueId: string, streamId: string) {
  return `visit_intent_${venueId}_${streamId}`;
}

export function VenueAttendanceCard({ stream, venue }: VenueAttendanceCardProps) {
  const router = useRouter();
  const { token, user } = useAuthStore();

  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(venue.intentCount ?? 0);
  const [arrivalCount, setArrivalCount] = useState(venue.arrivalCount ?? 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [qrData, setQrData] = useState<VisitArrivalResponse | null>(null);
  const [intentSubmitting, setIntentSubmitting] = useState(false);
  const [arrivalSubmitting, setArrivalSubmitting] = useState(false);
  const thankYouAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(intentKey(venue.id, stream.id)).then((val) => {
      if (val) setIntentPressed(true);
    });
  }, [venue.id, stream.id]);

  useSocket({
    'attendance:update': (data) => {
      if (data.streamId === stream.id) {
        setIntentCount(data.intentCount);
        setArrivalCount(data.arrivalCount);
      }
    },
  });

  const handleIntent = async () => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (intentPressed || intentSubmitting) return;
    setIntentSubmitting(true);
    try {
      await recordVisitIntent({ venueId: venue.id, streamId: stream.id }, token);
      setIntentPressed(true);
      await AsyncStorage.setItem(intentKey(venue.id, stream.id), '1');
      setIntentCount((c) => c + 1);
    } catch {
      // Socket update will correct counts
    } finally {
      setIntentSubmitting(false);
    }
  };

  const handleArrival = async () => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    if (arrivalPressed || arrivalSubmitting) return;
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
      // Socket update will correct counts
    } finally {
      setArrivalSubmitting(false);
    }
  };

  // If not logged in, show a sign-in nudge instead of the buttons
  if (!user) {
    return (
      <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
        <Text className="text-[13px] text-zinc-400 mb-3">Track your visit and claim perks</Text>
        <Pressable
          onPress={() => router.push('/login')}
          className="rounded-2xl bg-zinc-800 border border-zinc-700 py-3 items-center"
        >
          <Text className="text-sm font-medium text-zinc-300">Sign in to track your attendance</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
        <Text className="text-[13px] text-zinc-400 mb-4">Let the venue know you're coming</Text>

        {showThankYou && (
          <Animated.View
            className="mb-3 items-center"
            style={{
              opacity: thankYouAnim,
              transform: [{ translateY: thankYouAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
            }}
          >
            <Text className="text-xs font-medium text-zinc-400">Thank you from VibeCheck!</Text>
          </Animated.View>
        )}

        <View className="flex-row gap-2.5">
          <Pressable
            onPress={handleIntent}
            disabled={intentPressed || intentSubmitting}
            className={`flex-1 rounded-[16px] p-3.5 items-center ${
              intentPressed ? 'bg-green-500' : 'bg-zinc-800 border border-zinc-700'
            }`}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={intentPressed ? '#fff' : '#a1a1aa'}
              style={{ marginBottom: 6 }}
            />
            <Text className={`text-[11px] text-center ${intentPressed ? 'text-white font-medium' : 'text-zinc-400'}`}>
              I'm thinking{'\n'}about it
            </Text>
            <Text className={`text-[11px] mt-1 ${intentPressed ? 'text-white' : 'text-zinc-500'}`}>
              {intentCount}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleArrival}
            disabled={arrivalPressed || arrivalSubmitting}
            className={`flex-1 rounded-[16px] p-3.5 items-center ${
              arrivalPressed ? 'bg-zinc-700' : 'bg-zinc-800 border border-zinc-700'
            }`}
          >
            <Ionicons
              name="location-outline"
              size={22}
              color={arrivalPressed ? '#d4d4d8' : '#a1a1aa'}
              style={{ marginBottom: 6 }}
            />
            <Text className={`text-[11px] text-center ${arrivalPressed ? 'text-zinc-300 font-medium' : 'text-zinc-400'}`}>
              I've arrived!
            </Text>
            <Text className={`text-[11px] mt-1 ${arrivalPressed ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {arrivalCount}
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
