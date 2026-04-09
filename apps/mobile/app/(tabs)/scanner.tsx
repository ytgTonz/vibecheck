import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, Vibration, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchQRToken, redeemQRToken, useAuthStore } from '@vibecheck/shared';
import ScannerCamera from '@/components/scanner/ScannerCamera';
import ScanResultSheet, {
  type ScanState,
} from '@/components/scanner/ScanResultSheet';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ScannerScreen() {
  const router = useRouter();
  const { token: authToken } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ phase: 'scanning' });
  const processingRef = useRef(false);
  const autoResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
    };
  }, []);

  const resetToScanning = useCallback(() => {
    if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
    processingRef.current = false;
    setState({ phase: 'scanning' });
  }, []);

  const handleScan = useCallback(
    async (data: string) => {
      if (processingRef.current) return;
      processingRef.current = true;

      // Validate UUID format
      if (!UUID_REGEX.test(data)) {
        setState({
          phase: 'error',
          message: 'Not a valid VibeCheck QR code.',
        });
        return;
      }

      setState({ phase: 'loading', token: data });

      try {
        const preview = await fetchQRToken(data);

        if (!preview.valid) {
          // Show invalid state through the preview content
          setState({ phase: 'previewing', token: data, preview });
          return;
        }

        setState({ phase: 'previewing', token: data, preview });
      } catch {
        setState({
          phase: 'error',
          message: 'Could not look up QR code. Check your connection.',
        });
      }
    },
    [],
  );

  const handleRedeem = useCallback(async () => {
    if (state.phase !== 'previewing' || !authToken) return;

    setState({ phase: 'redeeming', token: state.token, preview: state.preview });

    try {
      const result = await redeemQRToken(state.token, authToken);
      Vibration.vibrate(100);
      setState({ phase: 'success', incentive: result.incentive });

      // Auto-reset after 4 seconds
      autoResetTimer.current = setTimeout(resetToScanning, 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to redeem QR code.';
      setState({ phase: 'error', message });
    }
  }, [state, authToken, resetToScanning]);

  // Permission not yet determined
  if (!permission) return null;

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <Ionicons name="camera-outline" size={32} color="#a1a1aa" />
            </View>
            <Text className="text-center text-lg font-semibold text-zinc-100">
              Camera Access Needed
            </Text>
            <Text className="text-center text-sm text-zinc-400">
              To scan visitor QR codes at the door, VibeCheck needs access to
              your camera.
            </Text>
            {!permission.canAskAgain ? (
              <Pressable
                onPress={() => Linking.openSettings()}
                className="mt-2 rounded-2xl bg-lime-500 px-6 py-3.5"
              >
                <Text className="text-sm font-bold text-zinc-950">
                  Open Settings
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={requestPermission}
                className="mt-2 rounded-2xl bg-lime-500 px-6 py-3.5"
              >
                <Text className="text-sm font-bold text-zinc-950">
                  Allow Camera
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <ScannerCamera
        onScan={handleScan}
        active={state.phase === 'scanning'}
      />

      {/* Top bar overlay */}
      <SafeAreaView
        edges={['top']}
        className="absolute left-0 right-0 top-0 z-10"
      >
        <Header onBack={() => router.back()} />
        <Text className="mt-1 text-center text-sm text-zinc-400">
          Point at a visitor's QR code
        </Text>
      </SafeAreaView>

      <ScanResultSheet
        state={state}
        onRedeem={handleRedeem}
        onScanNext={resetToScanning}
        onDismiss={resetToScanning}
      />
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 py-3">
      <Pressable
        onPress={onBack}
        className="h-9 w-9 items-center justify-center rounded-full bg-zinc-800/80"
      >
        <Ionicons name="chevron-back" size={20} color="#f4f4f5" />
      </Pressable>
      <Text className="ml-3 text-lg font-bold text-zinc-100">Scan QR</Text>
    </View>
  );
}
