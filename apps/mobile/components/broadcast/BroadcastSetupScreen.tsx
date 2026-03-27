import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LiveStream, Venue } from '@vibecheck/shared';

interface BroadcastSetupScreenProps {
  venue: Venue;
  stream: LiveStream | null;
  phase: 'setup' | 'connecting';
  error: string | null;
  onStart: () => void;
}

export function BroadcastSetupScreen({ venue, stream, phase, error, onStart }: BroadcastSetupScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 px-5 py-4">
        <Pressable
          onPress={() => router.replace('/upload')}
          className="mb-6 self-start rounded-full border border-zinc-800 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-zinc-300">Back</Text>
        </Pressable>

        <View className="rounded-[32px] border border-zinc-800 bg-zinc-900 px-6 py-7">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
            Go Live
          </Text>
          <Text className="mt-4 text-3xl font-semibold text-zinc-100">{venue.name}</Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-400">
            Start broadcasting from this venue with your camera and microphone.
          </Text>

          {error ? (
            <Text className="mt-4 text-sm text-red-400">{error}</Text>
          ) : null}

          {stream?.status === 'LIVE' ? (
            <View className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
              <Text className="text-sm font-semibold text-zinc-100">This venue is already live</Text>
              <Text className="mt-2 text-sm leading-6 text-zinc-400">
                Another team member may be running this stream right now.
              </Text>
              <Pressable
                onPress={() => router.replace('/upload')}
                className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3"
              >
                <Text className="text-center text-sm font-semibold text-zinc-950">
                  Back to dashboard
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onStart}
              disabled={phase === 'connecting'}
              className="mt-6 rounded-[24px] bg-red-500 px-5 py-4"
            >
              <Text className="text-center text-base font-semibold text-white">
                {phase === 'connecting' ? 'Connecting...' : 'Start Stream'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
