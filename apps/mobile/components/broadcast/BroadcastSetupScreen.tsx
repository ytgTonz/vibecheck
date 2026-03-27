import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LiveStream, Venue, venueTypeLabel } from '@vibecheck/shared';

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

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header row */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <Pressable
          onPress={() => router.replace('/upload')}
          className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Text className="text-zinc-200 text-lg">←</Text>
        </Pressable>
        <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
          <Text className="text-zinc-400 text-lg">📷</Text>
        </View>
      </View>

      {/* Camera preview placeholder */}
      <View className="flex-1 mx-5 rounded-[28px] bg-zinc-900 border border-zinc-800 items-center justify-center mb-5">
        <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-4">
          <Text className="text-4xl">📷</Text>
        </View>
        <Text className="text-base text-zinc-600 font-medium">Camera preview</Text>
        <Text className="text-xs text-zinc-700 mt-1">Will appear when live</Text>
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
          <Text className="text-xl text-zinc-600">›</Text>
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
            <Text className="text-lg">📷</Text>
            <Text className="text-sm text-zinc-500 flex-1 leading-relaxed">
              Hold your phone steady or use a tripod for best results
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-lg">🎙</Text>
            <Text className="text-sm text-zinc-500 flex-1 leading-relaxed">
              Audio is captured — let viewers hear the vibe
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
