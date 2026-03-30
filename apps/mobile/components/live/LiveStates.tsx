import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoadingState({ venueName }: { venueName?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-full max-w-[280px] items-center">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <ActivityIndicator size="small" color="#FF2D55" />
          </View>
          <Text className="text-center text-xl font-semibold text-white">
            {venueName ? `Joining ${venueName}` : 'Connecting'}
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-zinc-500">
            Setting up the live video feed and chat room.
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
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-full max-w-[280px] items-center">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Text className="text-2xl">📡</Text>
          </View>
          <Text className="text-center text-xl font-semibold text-white">{title}</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-zinc-500">{detail}</Text>

          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="mt-6 w-full rounded-full bg-red-500 py-3"
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
            className={`${onRetry ? 'mt-2' : 'mt-6'} w-full rounded-full bg-white/10 py-3`}
          >
            <Text className="text-center text-sm font-medium text-white">
              Back to venue
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
