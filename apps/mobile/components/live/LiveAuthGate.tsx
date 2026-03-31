import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export function LiveAuthGate({ onSignIn, onCreateAccount }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-full max-w-[280px] items-center">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Text className="text-2xl">🎥</Text>
          </View>
          <Text className="text-center text-xl font-semibold text-white">
            Sign in to watch live
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-zinc-500">
            Create a free account to watch live streams, track your visits, and claim venue perks.
          </Text>

          <Pressable
            onPress={onSignIn}
            className="mt-6 w-full rounded-full bg-brand-red py-3"
          >
            <Text className="text-center text-sm font-semibold text-white">
              Sign in
            </Text>
          </Pressable>

          <Pressable
            onPress={onCreateAccount}
            className="mt-2 w-full rounded-full bg-white/10 py-3"
          >
            <Text className="text-center text-sm font-medium text-white">
              Create account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
