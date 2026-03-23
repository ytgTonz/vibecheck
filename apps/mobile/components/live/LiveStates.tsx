import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoadingState({ venueName }: { venueName?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="absolute inset-0 bg-red-500/5" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[320px] rounded-[32px] border border-white/10 bg-zinc-900 px-6 py-8">
          <View className="mb-5 flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
              Joining live room
            </Text>
          </View>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-center text-2xl font-semibold text-zinc-100">
            {venueName ? `Connecting to ${venueName}` : 'Connecting to stream'}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-zinc-400">
            Pulling in the live video feed and chat so you can drop straight into the room.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function ErrorState({
  id,
  title,
  detail,
  onRetry,
}: {
  id?: string;
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="absolute inset-0 bg-red-500/5" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[340px] rounded-[32px] border border-white/10 bg-zinc-900 px-6 py-8">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-400">
            Live stream unavailable
          </Text>
          <Text className="mt-4 text-3xl font-semibold text-zinc-100">{title}</Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-400">{detail}</Text>

          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="mt-6 rounded-full bg-red-500 px-5 py-3"
            >
              <Text className="text-center text-sm font-semibold text-white">
                Try again
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() =>
              id
                ? router.replace({ pathname: '/venues/[id]', params: { id } })
                : router.back()
            }
            className={`${onRetry ? 'mt-3' : 'mt-6'} rounded-full bg-zinc-100 px-5 py-3`}
          >
            <Text className="text-center text-sm font-semibold text-zinc-950">
              Back to venue
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="mt-3 rounded-full bg-white/5 px-5 py-3">
            <Text className="text-center text-sm font-semibold text-white">Go back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
