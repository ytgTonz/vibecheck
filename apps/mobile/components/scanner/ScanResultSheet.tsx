import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { QRTokenPreview } from '@vibecheck/shared';

export type ScanState =
  | { phase: 'scanning' }
  | { phase: 'loading'; token: string }
  | { phase: 'previewing'; token: string; preview: QRTokenPreview }
  | { phase: 'redeeming'; token: string; preview: QRTokenPreview }
  | {
      phase: 'success';
      incentive: { title: string; description: string } | null;
    }
  | { phase: 'error'; message: string };

interface ScanResultSheetProps {
  state: ScanState;
  onRedeem: () => void;
  onScanNext: () => void;
  onDismiss: () => void;
}

export default function ScanResultSheet({
  state,
  onRedeem,
  onScanNext,
  onDismiss,
}: ScanResultSheetProps) {
  const insets = useSafeAreaInsets();

  if (state.phase === 'scanning') return null;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 rounded-t-[24px] border-t border-zinc-800 bg-zinc-900 px-5 pt-6"
      style={{ paddingBottom: Math.max(insets.bottom, 20) + 10 }}
    >
      {state.phase === 'loading' && <LoadingContent />}
      {state.phase === 'previewing' && (
        <PreviewContent
          preview={state.preview}
          onRedeem={onRedeem}
          onDismiss={onDismiss}
        />
      )}
      {state.phase === 'redeeming' && (
        <RedeemingContent preview={state.preview} />
      )}
      {state.phase === 'success' && (
        <SuccessContent
          incentive={state.incentive}
          onScanNext={onScanNext}
        />
      )}
      {state.phase === 'error' && (
        <ErrorContent message={state.message} onScanNext={onScanNext} />
      )}
    </View>
  );
}

function LoadingContent() {
  return (
    <View className="items-center py-6">
      <ActivityIndicator color="#BFFF00" size="large" />
      <Text className="mt-3 text-sm text-zinc-400">Looking up QR code...</Text>
    </View>
  );
}

function PreviewContent({
  preview,
  onRedeem,
  onDismiss,
}: {
  preview: QRTokenPreview;
  onRedeem: () => void;
  onDismiss: () => void;
}) {
  if (!preview.valid) {
    const message =
      preview.reason === 'already_used'
        ? 'This QR code has already been redeemed.'
        : preview.reason === 'expired'
          ? 'This QR code has expired.'
          : 'This QR code is not valid.';

    return (
      <View className="items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-red-900/40">
          <Ionicons name="close" size={32} color="#f87171" />
        </View>
        <Text className="text-center text-base font-semibold text-red-400">
          {message}
        </Text>
        {preview.venueName && (
          <Text className="text-sm text-zinc-400">{preview.venueName}</Text>
        )}
        <Pressable
          onPress={onDismiss}
          className="mt-2 w-full rounded-2xl bg-zinc-800 px-4 py-3.5"
        >
          <Text className="text-center text-sm font-semibold text-zinc-100">
            Scan Next
          </Text>
        </Pressable>
      </View>
    );
  }

  const expiresAt = preview.expiresAt ? new Date(preview.expiresAt) : null;
  const minutesLeft = expiresAt
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000))
    : null;

  return (
    <View className="items-center gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-lime-900/40">
        <Ionicons name="qr-code" size={28} color="#BFFF00" />
      </View>

      <View className="items-center">
        <Text className="text-lg font-bold text-zinc-100">Valid QR Code</Text>
        {preview.venueName && (
          <Text className="mt-1 text-sm text-zinc-400">
            {preview.venueName}
          </Text>
        )}
        {minutesLeft !== null && (
          <Text className="mt-1 text-xs text-zinc-500">
            Expires in {minutesLeft} min
          </Text>
        )}
      </View>

      {preview.incentive && (
        <View className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3">
          <Text className="text-sm font-semibold text-zinc-100">
            {preview.incentive.title}
          </Text>
          <Text className="mt-0.5 text-xs text-zinc-400">
            {preview.incentive.description}
          </Text>
        </View>
      )}

      <Pressable
        onPress={onRedeem}
        className="mt-1 w-full rounded-2xl bg-lime-500 px-4 py-3.5"
      >
        <Text className="text-center text-sm font-bold text-zinc-950">
          Redeem
        </Text>
      </Pressable>

      <Pressable onPress={onDismiss}>
        <Text className="text-sm text-zinc-500">Cancel</Text>
      </Pressable>
    </View>
  );
}

function RedeemingContent({ preview }: { preview: QRTokenPreview }) {
  return (
    <View className="items-center gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-lime-900/40">
        <Ionicons name="qr-code" size={28} color="#BFFF00" />
      </View>
      <Text className="text-lg font-bold text-zinc-100">Valid QR Code</Text>
      {preview.venueName && (
        <Text className="text-sm text-zinc-400">{preview.venueName}</Text>
      )}
      <View className="mt-1 w-full rounded-2xl bg-lime-500/50 px-4 py-3.5">
        <ActivityIndicator color="#09090b" />
      </View>
    </View>
  );
}

function SuccessContent({
  incentive,
  onScanNext,
}: {
  incentive: { title: string; description: string } | null;
  onScanNext: () => void;
}) {
  return (
    <View className="items-center gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-lime-900/40">
        <Ionicons name="checkmark" size={32} color="#BFFF00" />
      </View>

      <Text className="text-lg font-bold text-lime-400">Redeemed!</Text>

      {incentive && (
        <View className="w-full rounded-2xl border border-lime-800/50 bg-lime-950/30 px-4 py-3">
          <Text className="text-center text-xs font-semibold uppercase tracking-widest text-lime-500">
            Give to visitor
          </Text>
          <Text className="mt-2 text-center text-base font-bold text-zinc-100">
            {incentive.title}
          </Text>
          <Text className="mt-0.5 text-center text-sm text-zinc-400">
            {incentive.description}
          </Text>
        </View>
      )}

      <Pressable
        onPress={onScanNext}
        className="mt-1 w-full rounded-2xl bg-zinc-800 px-4 py-3.5"
      >
        <Text className="text-center text-sm font-semibold text-zinc-100">
          Scan Next
        </Text>
      </Pressable>
    </View>
  );
}

function ErrorContent({
  message,
  onScanNext,
}: {
  message: string;
  onScanNext: () => void;
}) {
  return (
    <View className="items-center gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-red-900/40">
        <Ionicons name="close" size={32} color="#f87171" />
      </View>

      <Text className="text-center text-base font-semibold text-red-400">
        {message}
      </Text>

      <Pressable
        onPress={onScanNext}
        className="mt-1 w-full rounded-2xl bg-zinc-800 px-4 py-3.5"
      >
        <Text className="text-center text-sm font-semibold text-zinc-100">
          Scan Next
        </Text>
      </Pressable>
    </View>
  );
}
