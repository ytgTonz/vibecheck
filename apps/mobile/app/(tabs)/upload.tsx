import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, createVideoPlayer } from 'expo-video';
import { fetchMyVenues, getBaseUrl, useAuthStore, VenueWithStats } from '@vibecheck/shared';
import AuthPanel from '@/components/AuthPanel';

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
] as const;

function formatBytes(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadScreen() {
  const router = useRouter();
  const { user, token, hydrate, logout } = useAuthStore();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewPlayer] = useState(() => {
    const player = createVideoPlayer(null);
    player.loop = true;
    player.muted = true;
    return player;
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    return () => {
      previewPlayer.release();
    };
  }, [previewPlayer]);

  useEffect(() => {
    if (!selectedAsset?.uri) return;

    void previewPlayer.replaceAsync({ uri: selectedAsset.uri }).catch(() => {});
  }, [previewPlayer, selectedAsset]);

  useEffect(() => {
    if (!token) return;

    setLoadingVenues(true);
    fetchMyVenues(token)
      .then((data) => {
        setVenues(data);
        if (data.length === 1) {
          setSelectedVenueId(data[0].id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load linked venues');
      })
      .finally(() => setLoadingVenues(false));
  }, [token]);

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === selectedVenueId) ?? null,
    [selectedVenueId, venues]
  );

  const pickFromLibrary = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedAsset(result.assets[0] ?? null);
    }
  };

  const pickFromCamera = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to record a clip.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      videoMaxDuration: 30,
    });

    if (!result.canceled) {
      setSelectedAsset(result.assets[0] ?? null);
    }
  };

  const handleUpload = async () => {
    if (!token) {
      setError('Sign in first.');
      return;
    }

    if (!selectedAsset?.uri) {
      setError('Choose or record a clip first.');
      return;
    }

    if (!selectedVenueId) {
      setError('Choose a venue.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('video', {
      uri: selectedAsset.uri,
      name: selectedAsset.fileName || `clip-${Date.now()}.mp4`,
      type: selectedAsset.mimeType || 'video/mp4',
    } as never);
    formData.append('venueId', selectedVenueId);
    if (selectedGenre) formData.append('musicGenre', selectedGenre);
    if (caption.trim()) formData.append('caption', caption.trim());

    try {
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          const body = JSON.parse(xhr.responseText || '{}');
          reject(new Error(body.error || `Upload failed: ${xhr.status}`));
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));

        xhr.open('POST', `${getBaseUrl()}/clips`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      setSelectedAsset(null);
      setCaption('');
      setSelectedGenre('');
      setProgress(0);
      router.push({
        pathname: '/venues/[id]',
        params: { id: selectedVenueId },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!user || !token) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-3xl font-semibold text-zinc-100">Upload</Text>
          <Text className="mt-2 text-sm text-zinc-400">
            Sign in with your existing owner or promoter account before posting a clip.
          </Text>
          <View className="mt-6">
            <AuthPanel
              title="Sign in to upload"
              body="Upload is limited to venues you own or have been linked to as a promoter."
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-semibold text-zinc-100">Upload</Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-400">
              Record or pick a short clip, tag the linked venue, and post it live.
            </Text>
          </View>
          <Pressable onPress={logout} className="rounded-full border border-zinc-700 px-3 py-2">
            <Text className="text-xs font-medium text-zinc-300">Log out</Text>
          </Pressable>
        </View>

        <View className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-5">
          <Text className="text-lg font-semibold text-zinc-100">1. Choose a clip</Text>
          <Text className="mt-1 text-sm text-zinc-400">
            Use the camera for a fresh vibe check or pull from your gallery.
          </Text>

          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={pickFromCamera}
              disabled={uploading}
              className="flex-1 rounded-2xl bg-zinc-100 px-4 py-4"
            >
              <Text className="text-center text-sm font-semibold text-zinc-950">Record clip</Text>
            </Pressable>
            <Pressable
              onPress={pickFromLibrary}
              disabled={uploading}
              className="flex-1 rounded-2xl border border-zinc-700 px-4 py-4"
            >
              <Text className="text-center text-sm font-semibold text-zinc-100">Pick from gallery</Text>
            </Pressable>
          </View>

          {selectedAsset && (
            <View className="mt-4 overflow-hidden rounded-[24px] border border-zinc-800 bg-black">
              <VideoView
                player={previewPlayer}
                nativeControls
                contentFit="cover"
                style={{ width: '100%', height: 240 }}
              />
              <View className="border-t border-zinc-800 px-4 py-3">
                <Text className="text-sm font-medium text-zinc-100">
                  {selectedAsset.fileName || 'Selected clip'}
                </Text>
                <Text className="mt-1 text-xs text-zinc-400">
                  {formatBytes(selectedAsset.fileSize) || 'Video ready'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="mt-5 rounded-[28px] border border-zinc-800 bg-zinc-900 p-5">
          <Text className="text-lg font-semibold text-zinc-100">2. Tag the venue</Text>
          <Text className="mt-1 text-sm text-zinc-400">
            Only your linked venues appear here.
          </Text>

          {loadingVenues ? (
            <View className="mt-4 flex-row items-center gap-3">
              <ActivityIndicator color="#f4f4f5" />
              <Text className="text-sm text-zinc-400">Loading venues…</Text>
            </View>
          ) : venues.length === 0 ? (
            <View className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <Text className="text-sm text-zinc-400">
                No linked venues yet. Ask an owner for an invite if you are a promoter.
              </Text>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {venues.map((venue) => (
                <Pressable
                  key={venue.id}
                  onPress={() => setSelectedVenueId(venue.id)}
                  className={`rounded-2xl border px-4 py-4 ${
                    selectedVenueId === venue.id
                      ? 'border-zinc-100 bg-zinc-100'
                      : 'border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedVenueId === venue.id ? 'text-zinc-950' : 'text-zinc-100'
                    }`}
                  >
                    {venue.name}
                  </Text>
                  <Text
                    className={`mt-1 text-xs ${
                      selectedVenueId === venue.id ? 'text-zinc-700' : 'text-zinc-400'
                    }`}
                  >
                    {venue.location}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="mt-5 rounded-[28px] border border-zinc-800 bg-zinc-900 p-5">
          <Text className="text-lg font-semibold text-zinc-100">3. Tag the sound</Text>
          <Text className="mt-1 text-sm text-zinc-400">
            Pick the closest genre. Skip it if the room is mixed.
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {MUSIC_GENRES.map((genre) => {
              const selected = genre === selectedGenre;
              return (
                <Pressable
                  key={genre}
                  onPress={() => setSelectedGenre((current) => (current === genre ? '' : genre))}
                  className={`rounded-full border px-4 py-2 ${
                    selected ? 'border-zinc-100 bg-zinc-100' : 'border-zinc-700 bg-zinc-950'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold uppercase tracking-[1.5px] ${
                      selected ? 'text-zinc-950' : 'text-zinc-200'
                    }`}
                  >
                    {genre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-5 rounded-[28px] border border-zinc-800 bg-zinc-900 p-5">
          <Text className="text-lg font-semibold text-zinc-100">4. Add a caption</Text>
          <Text className="mt-1 text-sm text-zinc-400">
            Keep it short and factual.
          </Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            maxLength={120}
            placeholder="What's the vibe?"
            placeholderTextColor="#71717a"
            className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-zinc-100"
          />
          <Text className="mt-2 text-xs text-zinc-500">{caption.length}/120</Text>
        </View>

        {selectedVenue && (
          <View className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4">
            <Text className="text-xs uppercase tracking-[2px] text-zinc-500">Posting to</Text>
            <Text className="mt-2 text-base font-semibold text-zinc-100">{selectedVenue.name}</Text>
            <Text className="mt-1 text-sm text-zinc-400">{selectedVenue.location}</Text>
          </View>
        )}

        {error && (
          <View className="mt-5 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3">
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        )}

        {uploading && (
          <View className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <Text className="text-sm font-medium text-zinc-100">Uploading… {progress}%</Text>
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <View className="h-full rounded-full bg-zinc-100" style={{ width: `${progress}%` }} />
            </View>
          </View>
        )}

        <Pressable
          onPress={handleUpload}
          disabled={uploading || !selectedAsset || !selectedVenueId}
          className="mt-6 rounded-[24px] bg-zinc-100 px-5 py-5"
          style={{ opacity: uploading || !selectedAsset || !selectedVenueId ? 0.5 : 1 }}
        >
          <Text className="text-center text-base font-semibold text-zinc-950">
            {uploading ? 'Posting clip…' : 'Post clip'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
