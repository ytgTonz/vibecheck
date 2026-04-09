import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { isReactionMessage } from './LiveReactions';

type ChatMessage = {
  from?: { name?: string; identity?: string };
  message: string;
  timestamp?: number;
};

const AVATAR_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f97316', '#ec4899', '#06b6d4'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'now';
  const diffMins = Math.floor((Date.now() - timestamp) / 60_000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h`;
}

export function LiveChatOverlay({
  messages,
  onSend,
  chatOpen,
  bottomOffset = 6,
}: {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  chatOpen: boolean;
  bottomOffset?: number;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardOffset = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      const extra = Platform.OS === 'android' ? 24 : 10;
      keyboardOffset.value = withTiming(e.endCoordinates.height + extra, {
        duration: Platform.OS === 'ios' ? 250 : 150,
        easing: Easing.out(Easing.quad),
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? 200 : 100,
        easing: Easing.in(Easing.quad),
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardOffset]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      Keyboard.dismiss();
    }
  }, [chatOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }],
  }));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const nonReactionMessages = messages.filter((m) => !isReactionMessage(m.message));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          bottom: bottomOffset,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingHorizontal: 12,
        },
        animatedStyle,
      ]}
    >
      {/* Message list — always visible */}
      <View style={{ maxWidth: '80%' }} className="mb-2">
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          className="max-h-[160px]"
        >
          {nonReactionMessages.length === 0 ? (
            <View className="px-1 py-2">
              <Text className="text-sm text-white/60">Join the chat.</Text>
            </View>
          ) : (
            nonReactionMessages.slice(-50).map((msg, index) => {
              const name = msg.from?.name || msg.from?.identity || 'Viewer';
              const color = getAvatarColor(name);
              const initials = getInitials(name);
              const time = getRelativeTime(msg.timestamp);
              return (
                <View
                  key={`${msg.from?.identity || 'viewer'}-${index}`}
                  className="mb-2 flex-row items-start gap-2 px-1"
                >
                  {/* Avatar */}
                  <View
                    style={{ backgroundColor: color, width: 28, height: 28, borderRadius: 14 }}
                    className="flex-shrink-0 items-center justify-center"
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: 'white' }}>
                      {initials}
                    </Text>
                  </View>

                  {/* Text content */}
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-baseline gap-1.5">
                      <Text
                        className="text-xs font-semibold text-white"
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text className="text-[10px] text-white/40">{time}</Text>
                    </View>
                    <Text
                      numberOfLines={2}
                      className="mt-0.5 text-sm leading-[18px] text-white/85"
                    >
                      {msg.message}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Chat input — only shown when chatOpen */}
      {chatOpen && (
        <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-2">
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="flex-1 px-2 py-1 text-sm text-white"
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim()}
            className={`h-9 w-9 items-center justify-center rounded-full ${
              text.trim() ? 'bg-brand-red' : 'bg-white/10'
            }`}
          >
            <Text className={`text-base font-bold ${text.trim() ? 'text-white' : 'text-zinc-500'}`}>
              ↑
            </Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}
