import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LiveStream, Venue, venueTypeLabel } from '@vibecheck/shared';

let mediaDevices: any;
let RTCView: any;
try {
  const webrtc = require('@livekit/react-native-webrtc');
  mediaDevices = webrtc.mediaDevices;
  RTCView = webrtc.RTCView;
} catch {
  // Not available in Expo Go
}

interface BroadcastSetupScreenProps {
  venue: Venue;
  stream: LiveStream | null;
  phase: 'setup' | 'connecting';
  error: string | null;
  onStart: () => void;
}

export function BroadcastSetupScreen({ venue, stream, phase, error, onStart }: BroadcastSetupScreenProps) {
  const router = useRouter();
  const isConnecting = phase === 'connecting';
  const [cameraStream, setCameraStream] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (!mediaDevices) return;
    let cancelled = false;
    let localStream: any = null;

    const startCamera = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t: any) => t.stop());
          return;
        }
        localStream = stream;
        setCameraStream(stream);
      } catch {
        // Permission denied or unavailable
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      localStream?.getTracks().forEach((t: any) => t.stop());
      setCameraStream(null);
    };
  }, [facingMode]);

  const handleFlip = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <Pressable
          onPress={() => router.replace('/upload')}
          className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#e4e4e7" />
        </Pressable>
        <Pressable
          onPress={handleFlip}
          className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#a1a1aa" />
        </Pressable>
      </View>

      {/* Camera preview */}
      <View className="flex-1 mx-5 rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800 mb-5">
        {cameraStream && RTCView ? (
          <RTCView
            streamURL={cameraStream.toURL()}
            style={StyleSheet.absoluteFillObject}
            objectFit="cover"
            mirror={facingMode === 'user'}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-4">
              <Ionicons name="camera-outline" size={36} color="#52525b" />
            </View>
            <Text className="text-base text-zinc-600 font-medium">
              {mediaDevices ? 'Starting camera…' : 'Camera preview'}
            </Text>
            {!mediaDevices && (
              <Text className="text-xs text-zinc-700 mt-1">Available in dev build</Text>
            )}
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View className="px-5 pb-5 gap-4">
        {/* Venue selector */}
        <View className="rounded-[20px] border border-zinc-800 bg-zinc-900 px-5 py-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[17px] font-semibold text-zinc-100">{venue.name}</Text>
            <Text className="text-sm text-zinc-500 mt-0.5">
              {venueTypeLabel[venue.type] ?? venue.type} · {venue.location}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525b" />
        </View>

        {error && (
          <Text className="text-sm text-red-400 px-1">{error}</Text>
        )}

        {stream?.status === 'LIVE' ? (
          <View className="rounded-[20px] border border-zinc-800 bg-zinc-900 px-5 py-5">
            <Text className="text-base font-semibold text-zinc-100">This venue is already live</Text>
            <Text className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
              Another team member may be streaming right now.
            </Text>
            <Pressable
              onPress={() => router.replace('/upload')}
              className="mt-4 rounded-2xl bg-zinc-100 py-3.5"
            >
              <Text className="text-center text-[15px] font-semibold text-zinc-950">
                Back to dashboard
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onStart}
            disabled={isConnecting}
            className="rounded-[20px] bg-red-600 py-5 flex-row items-center justify-center gap-3"
            style={{ opacity: isConnecting ? 0.7 : 1 }}
          >
            <View className="w-3 h-3 rounded-full bg-white" />
            <Text className="text-xl font-semibold text-white">
              {isConnecting ? 'Connecting…' : 'Go live'}
            </Text>
          </Pressable>
        )}

        {/* Tips */}
        <View className="gap-3 px-1 pb-1">
          <View className="flex-row items-start gap-3">
            <Ionicons name="camera-outline" size={18} color="#71717a" style={{ marginTop: 1 }} />
            <Text className="text-sm text-zinc-500 flex-1 leading-relaxed">
              Hold your phone steady or use a tripod for best results
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Ionicons name="mic-outline" size={18} color="#71717a" style={{ marginTop: 1 }} />
            <Text className="text-sm text-zinc-500 flex-1 leading-relaxed">
              Audio is captured — let viewers hear the vibe
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
