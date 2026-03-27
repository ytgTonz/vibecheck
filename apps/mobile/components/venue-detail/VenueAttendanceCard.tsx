import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LiveStream, Venue, useAuthStore, useSocket, recordAttendanceIntent, recordAttendanceArrival } from '@vibecheck/shared';
import { getDeviceId } from '../../lib/deviceId';

interface VenueAttendanceCardProps {
  stream: LiveStream;
  venue: Venue;
}

export function VenueAttendanceCard({ stream, venue }: VenueAttendanceCardProps) {
  const token = useAuthStore((s) => s.token) ?? undefined;
  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(venue.intentCount ?? 0);
  const [arrivalCount, setArrivalCount] = useState(venue.arrivalCount ?? 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const thankYouAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.multiGet([
      `attendance_intent_${stream.id}`,
      `attendance_arrival_${stream.id}`,
    ]).then((results) => {
      if (results[0][1]) setIntentPressed(true);
      if (results[1][1]) setArrivalPressed(true);
    });
  }, [stream.id]);

  useSocket({
    'attendance:update': (data) => {
      if (data.streamId === stream.id) {
        setIntentCount(data.intentCount);
        setArrivalCount(data.arrivalCount);
      }
    },
  });

  const handleIntent = async () => {
    if (intentPressed) return;
    setIntentPressed(true);
    await AsyncStorage.setItem(`attendance_intent_${stream.id}`, '1');
    try {
      const deviceId = await getDeviceId();
      const result = await recordAttendanceIntent(stream.id, deviceId, token);
      setIntentCount(result.intentCount);
      setArrivalCount(result.arrivalCount);
    } catch {
      // Socket update will correct counts
    }
  };

  const handleArrival = async () => {
    if (arrivalPressed) return;
    setArrivalPressed(true);
    await AsyncStorage.setItem(`attendance_arrival_${stream.id}`, '1');
    setShowThankYou(true);
    Animated.sequence([
      Animated.timing(thankYouAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(thankYouAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowThankYou(false));
    try {
      const deviceId = await getDeviceId();
      const result = await recordAttendanceArrival(stream.id, deviceId, token);
      setIntentCount(result.intentCount);
      setArrivalCount(result.arrivalCount);
    } catch {
      // Socket update will correct counts
    }
  };

  return (
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
          disabled={intentPressed}
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
          disabled={arrivalPressed}
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
  );
}
