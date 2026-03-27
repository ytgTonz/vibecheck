import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RegisterPayload, useAuthStore, VenueType } from '@vibecheck/shared';

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: 'Nightclub' },
  { value: VenueType.BAR, label: 'Bar' },
  { value: VenueType.RESTAURANT_BAR, label: 'Restaurant & Bar' },
  { value: VenueType.LOUNGE, label: 'Lounge' },
  { value: VenueType.SHISA_NYAMA, label: 'Shisa Nyama' },
  { value: VenueType.ROOFTOP, label: 'Rooftop' },
  { value: VenueType.OTHER, label: 'Other' },
];

const MUSIC_GENRES = [
  'Afrobeats',
  'Amapiano',
  'R&B',
  'Hip Hop',
  'House',
  'Jazz',
  'Soul',
  'Kwaito',
  'Dancehall',
  'Other',
];

export default function MobileRegisterScreen() {
  const router = useRouter();
  const { user, hydrated, loading, error, register, hydrate } = useAuthStore();

  const [accountType, setAccountType] = useState<'owner' | 'promoter' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState<VenueType | null>(null);
  const [venueLocation, setVenueLocation] = useState('');
  const [venueHours, setVenueHours] = useState('');
  const [venueGenres, setVenueGenres] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/dashboard');
    }
  }, [hydrated, user, router]);

  const toggleGenre = (genre: string) => {
    setVenueGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre],
    );
  };

  const handleRegister = async () => {
    if (!accountType) {
      setLocalError('Choose whether you are a venue owner or promoter.');
      return;
    }

    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Fill in your name, email, and password.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

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
      if (!inviteCode.trim()) {
        setLocalError('Enter your invite code.');
        return;
      }

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
      // store error is rendered below
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View className="mb-8">
          <Text className="text-3xl font-semibold text-zinc-100">Create account</Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-400">
            Register as a venue owner or join as a promoter with an invite code.
          </Text>
        </View>

        <View className="mb-5 gap-3">
          <Pressable
            onPress={() => setAccountType('owner')}
            className={`rounded-2xl border p-4 ${
              accountType === 'owner' ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <Text className="text-base font-semibold text-zinc-100">I own a venue</Text>
            <Text className="mt-1 text-sm text-zinc-400">
              Create your venue and manage your team.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAccountType('promoter')}
            className={`rounded-2xl border p-4 ${
              accountType === 'promoter' ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <Text className="text-base font-semibold text-zinc-100">I have an invite code</Text>
            <Text className="mt-1 text-sm text-zinc-400">
              Join a venue as a promoter with an owner-issued code.
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#71717a"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
          />

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
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#71717a"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
          />

          {accountType === 'owner' && (
            <>
              <View className="mt-3">
                <Text className="mb-2 text-sm font-medium text-zinc-300">Venue details</Text>
              </View>

              <TextInput
                value={venueName}
                onChangeText={setVenueName}
                placeholder="Venue name"
                placeholderTextColor="#71717a"
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <TextInput
                value={venueLocation}
                onChangeText={setVenueLocation}
                placeholder="Location"
                placeholderTextColor="#71717a"
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <TextInput
                value={venueHours}
                onChangeText={setVenueHours}
                placeholder="Hours (optional)"
                placeholderTextColor="#71717a"
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
              />

              <View>
                <Text className="mb-2 text-sm text-zinc-400">Venue type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {VENUE_TYPES.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => setVenueType(type.value)}
                      className={`rounded-full border px-3 py-2 ${
                        venueType === type.value
                          ? 'border-zinc-100 bg-zinc-100/10'
                          : 'border-zinc-700 bg-zinc-900'
                      }`}
                    >
                      <Text className="text-xs font-medium text-zinc-200">{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="mb-2 text-sm text-zinc-400">Genres</Text>
                <View className="flex-row flex-wrap gap-2">
                  {MUSIC_GENRES.map((genre) => {
                    const selected = venueGenres.includes(genre);
                    return (
                      <Pressable
                        key={genre}
                        onPress={() => toggleGenre(genre)}
                        className={`rounded-full border px-3 py-2 ${
                          selected ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        <Text className="text-xs font-medium text-zinc-200">{genre}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {accountType === 'promoter' && (
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              placeholder="Invite code"
              placeholderTextColor="#71717a"
              className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
            />
          )}

          {!hydrated ? (
            <Text className="text-sm text-zinc-500">Restoring session…</Text>
          ) : null}

          {(localError || error) && (
            <Text className="text-sm text-red-400">{localError || error}</Text>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={loading || !hydrated}
            className="rounded-2xl bg-zinc-100 px-4 py-3"
            style={{ opacity: loading || !hydrated ? 0.6 : 1 }}
          >
            <Text className="text-center text-sm font-semibold text-zinc-950">
              {loading ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/login')}
            className="rounded-2xl border border-zinc-700 px-4 py-3"
          >
            <Text className="text-center text-sm font-medium text-zinc-300">
              Already have an account? Sign in
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
