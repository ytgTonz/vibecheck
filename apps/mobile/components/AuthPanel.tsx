import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@vibecheck/shared';

export default function AuthPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const router = useRouter();
  const { user, loading, error, hydrated, login, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password.');
      return;
    }
    setLocalError(null);
    try {
      await login(email.trim(), password);
    } catch {
      // store error rendered below
    }
  };

  if (user) return null;

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base text-zinc-500">Restoring session…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-zinc-100">{title}</Text>
        <Text className="mt-2 text-sm text-zinc-400">{body}</Text>
      </View>

      <View className="gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#52525b"
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-[15px] text-zinc-100"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#52525b"
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-[15px] text-zinc-100"
        />

        {(localError || error) && (
          <Text className="text-sm text-red-400">{localError || error}</Text>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="rounded-2xl bg-zinc-100 py-3.5 px-4"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-center text-[15px] font-semibold text-zinc-950">
            {loading ? 'Signing in…' : 'Sign in'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/register')}
          className="rounded-2xl border border-zinc-700 py-3.5 px-4"
        >
          <Text className="text-center text-[15px] font-medium text-zinc-300">
            Create account
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')} className="pt-1">
          <Text className="text-center text-sm text-zinc-500">
            Sign in with a different method →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
