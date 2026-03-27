import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@vibecheck/shared';

export default function MobileLoginScreen() {
  const router = useRouter();
  const { user, loading, error, hydrated, login, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/dashboard');
    }
  }, [hydrated, user, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password.');
      return;
    }

    setLocalError(null);

    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch {
      // store error is rendered below
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}>
        <View className="mb-8">
          <Text className="text-3xl font-semibold text-zinc-100">Sign in</Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-400">
            Access your linked venues, upload tools, and live controls.
          </Text>
        </View>

        <View className="gap-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#71717a"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#71717a"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
          />

          {!hydrated ? (
            <Text className="text-sm text-zinc-500">Restoring session…</Text>
          ) : null}

          {(localError || error) && (
            <Text className="text-sm text-red-400">{localError || error}</Text>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={loading || !hydrated}
            className="rounded-2xl bg-zinc-100 px-4 py-3"
            style={{ opacity: loading || !hydrated ? 0.6 : 1 }}
          >
            <Text className="text-center text-sm font-semibold text-zinc-950">
              {loading ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/register')}
            className="rounded-2xl border border-zinc-700 px-4 py-3"
          >
            <Text className="text-center text-sm font-medium text-zinc-300">
              Create account
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="pt-2">
            <Text className="text-center text-sm text-zinc-500">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
