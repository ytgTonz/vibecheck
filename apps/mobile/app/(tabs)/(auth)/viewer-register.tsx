import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { register as apiRegister, useAuthStore } from '@vibecheck/shared';

export default function ViewerRegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!displayName.trim()) { setError('Enter your name.'); return; }
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!password) { setError('Enter a password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!phone.trim()) { setError('Enter your phone number.'); return; }

    setError(null);
    setLoading(true);
    try {
      const response = await apiRegister({
        accountType: 'viewer',
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });

      await setAuth(response.token, response.user);

      // Pass stub OTP to verify-phone screen for dev testing
      const stubOtp = response.otpDebug?.phoneOtp;
      router.replace({
        pathname: '/(tabs)/(auth)/verify-phone' as never,
        params: stubOtp ? { stubOtp } : {},
      } as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-zinc-100">Create account</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Join VibeCheck to discover venues and track your visits.
            </Text>
          </View>

          <View className="gap-3">
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#52525b"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-[15px] text-zinc-100"
            />

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
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
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

            {/* Confirm password with peek toggle */}
            <View className="rounded-2xl border border-zinc-700 bg-zinc-900 flex-row items-center pr-3">
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Confirm password"
                placeholderTextColor="#52525b"
                className="flex-1 px-4 py-3.5 text-[15px] text-zinc-100"
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                <SymbolView
                  name={showConfirm
                    ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                    : { ios: 'eye', android: 'visibility', web: 'visibility' }
                  }
                  tintColor="#71717a"
                  size={20}
                />
              </Pressable>
            </View>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor="#52525b"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-[15px] text-zinc-100"
            />

            {error && (
              <Text className="text-sm text-red-400">{error}</Text>
            )}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className="rounded-2xl bg-zinc-100 py-3.5 px-4"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <Text className="text-center text-[15px] font-semibold text-zinc-950">
                {loading ? 'Creating account…' : 'Create account'}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-center text-sm text-zinc-500 pt-1">
                Already have an account?{' '}
                <Text className="text-zinc-300 font-medium">Sign in</Text>
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push('/register')} className="pt-1">
              <Text className="text-center text-sm text-zinc-600">
                Registering a venue?{' '}
                <Text className="text-zinc-400">Owner / Promoter sign up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
