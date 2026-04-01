import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@vibecheck/shared';
import VibecheckIcon from '@/components/VibecheckIcon';

async function markOnboardingSeen() {
  await AsyncStorage.setItem('vc_onboarding_seen', 'true');
}

export default function GateScreen() {
  const router = useRouter();

  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user) {
      void markOnboardingSeen();
      router.replace('/');
    }
  }, [router]);

  const handleBrowse = async () => {
    await markOnboardingSeen();
    router.replace('/');
  };

  const handleSignIn = async () => {
    await markOnboardingSeen();
    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950 px-6 justify-between">
      <Pressable
        className="self-end py-2 px-1 active:opacity-70"
        onPress={handleBrowse}
      >
        <Text className="text-sm text-zinc-600">Skip</Text>
      </Pressable>

      <View className="flex-1 items-center justify-center gap-3">
        <VibecheckIcon size={80} />
        <Text
          className="text-zinc-100"
          style={{ fontSize: 52, fontFamily: 'BebasNeue_400Regular', letterSpacing: 2 }}
        >
          VIBE<Text className="text-[#FF2D55]">CHECK</Text>
        </Text>
        <Text className="text-[15px] text-zinc-500">Feel the night.</Text>
      </View>

      <View className="pb-3 gap-3">
        <Pressable
          className="bg-zinc-100 rounded-2xl py-3.5 items-center active:opacity-70"
          onPress={handleBrowse}
        >
          <Text className="text-[15px] font-semibold text-zinc-950">Browse venues</Text>
        </Pressable>

        <Pressable
          className="border border-zinc-700 rounded-2xl py-3.5 items-center active:opacity-70"
          onPress={handleSignIn}
        >
          <Text className="text-[15px] font-medium text-zinc-300">Sign in</Text>
        </Pressable>

        <Pressable
          className="items-center py-2.5 active:opacity-70"
          onPress={handleCreateAccount}
        >
          <Text className="text-sm text-zinc-500">Create account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
