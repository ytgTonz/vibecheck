import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuthStore } from '@vibecheck/shared';

export default function MobileLoginScreen() {
  const router = useRouter();
  const { loading, error, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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
      // store error rendered below
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-zinc-100">Sign in</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Access your venues and live controls.
            </Text>
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

            {/* Password with peek toggle */}
            <View className="rounded-2xl border border-zinc-700 bg-zinc-900 flex-row items-center pr-3">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                placeholderTextColor="#52525b"
                className="flex-1 px-4 py-3.5 text-[15px] text-zinc-100"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <SymbolView
                  name={showPassword
                    ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                    : { ios: 'eye', android: 'visibility', web: 'visibility' }
                  }
                  tintColor="#71717a"
                  size={20}
                />
              </Pressable>
            </View>

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

            <Pressable onPress={() => router.back()} className="pt-2">
              <Text className="text-center text-sm text-zinc-500">Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
