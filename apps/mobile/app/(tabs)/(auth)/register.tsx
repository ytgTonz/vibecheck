import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { RegisterPayload, useAuthStore, VenueType } from '@vibecheck/shared';
import { AccountTypeSelector } from '@/components/auth/AccountTypeSelector';
import { VenueRegistrationFields } from '@/components/auth/VenueRegistrationFields';
import { PromoterInviteField } from '@/components/auth/PromoterInviteField';

export default function MobileRegisterScreen() {
  const router = useRouter();
  const { loading, error, register } = useAuthStore();

  const [accountType, setAccountType] = useState<'owner' | 'promoter' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState<VenueType | null>(null);
  const [venueLocation, setVenueLocation] = useState('');
  const [venueHours, setVenueHours] = useState('');
  const [venueGenres, setVenueGenres] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const toggleGenre = (genre: string) => {
    setVenueGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  };

  const handleRegister = async () => {
    if (!accountType) { setLocalError('Choose your account type.'); return; }
    if (!name.trim() || !email.trim() || !password) { setLocalError('Fill in your name, email, and password.'); return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setLocalError('Passwords do not match.'); return; }

    let payload: RegisterPayload;

    if (accountType === 'owner') {
      if (!venueName.trim() || !venueType || !venueLocation.trim()) {
        setLocalError('Enter your venue name, type, and location.');
        return;
      }
      payload = {
        accountType: 'owner',
        email: email.trim(),
        password,
        name: name.trim(),
        venue: {
          name: venueName.trim(),
          type: venueType,
          location: venueLocation.trim(),
          hours: venueHours.trim() || undefined,
          musicGenre: venueGenres.length > 0 ? venueGenres : undefined,
        },
      };
    } else {
      if (!inviteCode.trim()) { setLocalError('Enter your invite code.'); return; }
      payload = {
        accountType: 'promoter',
        email: email.trim(),
        password,
        name: name.trim(),
        inviteCode: inviteCode.trim().toUpperCase(),
      };
    }

    setLocalError(null);
    try {
      await register(payload);
      router.replace(accountType === 'owner' ? '/dashboard' : '/upload');
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
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-zinc-100">Create account</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Join VibeCheck to discover venues or manage your own.
            </Text>
          </View>

          <View className="gap-3 mb-5">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
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
          </View>

          <AccountTypeSelector accountType={accountType} onSelect={setAccountType} />

          <View className="gap-3">
            {accountType === 'owner' && (
              <VenueRegistrationFields
                venueName={venueName}
                venueLocation={venueLocation}
                venueHours={venueHours}
                venueType={venueType}
                venueGenres={venueGenres}
                onVenueNameChange={setVenueName}
                onVenueLocationChange={setVenueLocation}
                onVenueHoursChange={setVenueHours}
                onVenueTypeChange={setVenueType}
                onToggleGenre={toggleGenre}
              />
            )}

            {accountType === 'promoter' && (
              <PromoterInviteField inviteCode={inviteCode} onInviteCodeChange={setInviteCode} />
            )}

            {(localError || error) && (
              <Text className="text-sm text-red-400">{localError || error}</Text>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
