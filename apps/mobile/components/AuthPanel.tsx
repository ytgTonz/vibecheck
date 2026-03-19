import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@vibecheck/shared';

export default function AuthPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const { user, loading, error, login, hydrate } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
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
      // store error is rendered below
    }
  };

  if (user) {
    return null;
  }

  return (
    <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
      <Text className="text-xl font-semibold text-zinc-100">{title}</Text>
      <Text className="mt-2 text-sm leading-6 text-zinc-400">{body}</Text>

      <View className="mt-5 gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#71717a"
          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#71717a"
          className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
        />

        {(localError || error) && (
          <Text className="text-sm text-red-400">{localError || error}</Text>
        )}

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          className="rounded-2xl bg-zinc-100 px-4 py-3"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-center text-sm font-semibold text-zinc-950">
            {loading ? 'Signing in…' : 'Sign in'}
          </Text>
        </Pressable>

        <Text className="text-xs leading-5 text-zinc-500">
          Use an existing venue owner or promoter account. Mobile registration can follow after upload/dashboard parity.
        </Text>
      </View>
    </View>
  );
}
