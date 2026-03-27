import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveStream, Venue, useAuthStore, useSocket, recordAttendanceIntent, recordAttendanceArrival } from '@vibecheck/shared';
import { getDeviceId } from '../../lib/deviceId';

interface Props {
  stream: LiveStream;
  venue: Venue;
}

function intentKey(streamId: string) {
  return `attendance_intent_${streamId}`;
}

function arrivalKey(streamId: string) {
  return `attendance_arrival_${streamId}`;
}

export function LiveAttendanceBar({ stream, venue }: Props) {
  const token = useAuthStore((s) => s.token) ?? undefined;

  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(venue.intentCount ?? 0);
  const [arrivalCount, setArrivalCount] = useState(venue.arrivalCount ?? 0);
  const [showThankYou, setShowThankYou] = useState(false);
  const thankYouAnim = useRef(new Animated.Value(0)).current;

  // Restore pressed state from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet([intentKey(stream.id), arrivalKey(stream.id)]).then(
      (results) => {
        if (results[0][1]) setIntentPressed(true);
        if (results[1][1]) setArrivalPressed(true);
      },
    );
  }, [stream.id]);

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
    if (intentPressed) return;
    setIntentPressed(true);
    await AsyncStorage.setItem(intentKey(stream.id), '1');
    try {
      const deviceId = await getDeviceId();
      const result = await recordAttendanceIntent(stream.id, deviceId, token);
      setIntentCount(result.intentCount);
      setArrivalCount(result.arrivalCount);
    } catch {
      // Count will update via socket; local button state stays pressed
    }
  };

  const handleArrival = async () => {
    if (arrivalPressed) return;
    setArrivalPressed(true);
    await AsyncStorage.setItem(arrivalKey(stream.id), '1');
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
      // Count will update via socket; local button state stays pressed
    }
  };

  return (
    <View
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      className="px-4 pb-8 pt-2"
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
      <View className="flex-row gap-3">
        <Pressable
          onPress={handleIntent}
          disabled={intentPressed}
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
          disabled={arrivalPressed}
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
  );
}
