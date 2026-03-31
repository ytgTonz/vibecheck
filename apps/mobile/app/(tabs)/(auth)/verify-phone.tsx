import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyPhone, useAuthStore } from '@vibecheck/shared';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { stubOtp } = useLocalSearchParams<{ stubOtp?: string }>();
  const { token, setUser } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus the input on mount
    const timeout = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }

    if (!token) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { user } = await verifyPhone(otp, token);
      setUser(user);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-6 justify-center gap-6">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-zinc-100">Verify your number</Text>
            <Text className="text-sm text-zinc-400">
              Enter the 6-digit code sent to your phone.
            </Text>
          </View>

          {/* Dev stub: show the OTP directly since SMS is not wired yet */}
          {stubOtp && (
            <View className="rounded-xl bg-amber-950 border border-amber-700 px-4 py-3">
              <Text className="text-xs text-amber-400 font-medium mb-1">Dev stub — SMS not wired</Text>
              <Text className="text-sm text-amber-200">Your OTP: <Text className="font-mono font-bold">{stubOtp}</Text></Text>
            </View>
          )}

          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#52525b"
            textAlign="center"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-2xl font-mono tracking-widest text-zinc-100"
          />

          {error && (
            <Text className="text-sm text-red-400">{error}</Text>
          )}

          <Pressable
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
            className="rounded-2xl bg-zinc-100 py-3.5 px-4"
            style={{ opacity: loading || otp.length !== 6 ? 0.5 : 1 }}
          >
            <Text className="text-center text-[15px] font-semibold text-zinc-950">
              {loading ? 'Verifying…' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="pt-1">
            <Text className="text-center text-sm text-zinc-500">Back</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
