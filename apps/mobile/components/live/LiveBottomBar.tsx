import { Pressable, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LiveBottomBarProps {
  venueName: string;
  chatOpen: boolean;
  onChatToggle: () => void;
}

export function LiveBottomBar({ venueName, chatOpen, onChatToggle }: LiveBottomBarProps) {
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      await Share.share({
        title: venueName,
        message: `Watch ${venueName} live on VibeCheck`,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-20 flex-row items-center gap-3 bg-zinc-950/80 px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }}
    >
      {/* Chat toggle */}
      <Pressable
        onPress={onChatToggle}
        hitSlop={8}
        className={`h-11 w-11 items-center justify-center rounded-full ${
          chatOpen ? 'bg-brand-red' : 'bg-white/10'
        }`}
      >
        <Ionicons
          name={chatOpen ? 'chatbubble' : 'chatbubble-outline'}
          size={20}
          color="white"
        />
      </Pressable>

      {/* Share stream */}
      <Pressable
        onPress={handleShare}
        className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-brand-red py-3"
      >
        <Ionicons name="share-outline" size={16} color="white" />
        <Text className="text-sm font-semibold text-white">Share stream</Text>
      </Pressable>

      {/* Bookmark placeholder */}
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10 opacity-60">
        <Ionicons name="bookmark-outline" size={20} color="white" />
      </View>
    </View>
  );
}
