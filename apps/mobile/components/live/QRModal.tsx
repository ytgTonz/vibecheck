import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

interface Props {
  visible: boolean;
  qrToken: string;
  expiresAt: string; // ISO string from server — do not recalculate on device
  incentive: { title: string; description: string } | null;
  onClose: () => void;
}

function useCountdown(expiresAt: string) {
  const getSecondsLeft = () => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(diff, 0);
  };

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  if (secondsLeft <= 0) return 'Expired';
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function QRModal({ visible, qrToken, expiresAt, incentive, onClose }: Props) {
  const timeLeft = useCountdown(expiresAt);
  const expired = timeLeft === 'Expired';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-zinc-950 px-6 pt-8 pb-10 items-center justify-between">
        <View className="w-full items-center gap-4">
          <Text className="text-2xl font-bold text-zinc-100">Show this at the door</Text>

          {incentive && (
            <View className="w-full rounded-2xl bg-zinc-900 border border-zinc-700 px-4 py-3">
              <Text className="text-base font-semibold text-zinc-100">{incentive.title}</Text>
              <Text className="text-sm text-zinc-400 mt-0.5">{incentive.description}</Text>
            </View>
          )}

          {/* QR code */}
          <View className={`mt-2 rounded-2xl bg-white p-5 ${expired ? 'opacity-30' : ''}`}>
            <QRCode value={qrToken} size={220} backgroundColor="white" color="black" />
          </View>

          {/* Countdown */}
          <View className="flex-row items-center gap-2">
            <View className={`rounded-full px-3 py-1 ${expired ? 'bg-red-900/50' : 'bg-zinc-800'}`}>
              <Text className={`text-sm font-mono font-semibold ${expired ? 'text-red-400' : 'text-zinc-300'}`}>
                {expired ? 'QR Expired' : `Expires in ${timeLeft}`}
              </Text>
            </View>
          </View>

          {expired && (
            <Text className="text-sm text-zinc-500 text-center">
              This QR code has expired. Contact the venue if you need assistance.
            </Text>
          )}
        </View>

        <Pressable
          onPress={onClose}
          className="w-full rounded-2xl bg-zinc-800 py-3.5"
        >
          <Text className="text-center text-[15px] font-semibold text-zinc-300">Close</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
