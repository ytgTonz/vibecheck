import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isReactionMessage } from './LiveReactions';

type ChatMessage = {
  from?: { name?: string; identity?: string };
  message: string;
};

export function LiveChatOverlay({
  messages,
  onSend,
  visible,
  onToggle,
  bottomInset = 0,
}: {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  visible: boolean;
  onToggle: () => void;
  bottomInset?: number;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const messageCount = messages.length;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 12,
        paddingBottom: 12 + bottomInset,
      }}
    >
      {!visible ? (
        <View className="items-start">
          <Pressable
            onPress={onToggle}
            className="rounded-full border border-white/10 bg-black/70 px-4 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">
              Chat
              {messageCount > 0 ? ` · ${messageCount}` : ''}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="overflow-hidden rounded-[24px] border border-white/10 bg-black/72">
          <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-2.5">
            <View>
              <Text className="text-sm font-semibold text-white">Live chat</Text>
              <Text className="mt-0.5 text-xs text-zinc-400">
                {messageCount === 0
                  ? 'Be the first to drop a message'
                  : `${messageCount} message${messageCount === 1 ? '' : 's'} in the room`}
              </Text>
            </View>
            <Pressable
              onPress={onToggle}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
            >
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-200">
                Hide
              </Text>
            </Pressable>
          </View>

          <View className="px-4 pt-3">
            <ScrollView
              ref={scrollRef}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
              className="max-h-[110px]"
            >
              {messageCount === 0 ? (
                <View className="pb-2">
                  <Text className="text-sm text-zinc-400">
                    Reactions, shout-outs, and questions from viewers will land here.
                  </Text>
                </View>
              ) : (
                messages.slice(-20).map((msg, index) => (
                  isReactionMessage(msg.message) ? (
                    <View
                      key={`${msg.from?.identity || 'viewer'}-${index}`}
                      className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text className="text-2xl">{msg.message.trim()}</Text>
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
                          {msg.from?.name || msg.from?.identity || 'Viewer'}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
                        Reacted
                      </Text>
                    </View>
                  ) : (
                    <View
                      key={`${msg.from?.identity || 'viewer'}-${index}`}
                      className="mb-2 rounded-2xl bg-white/5 px-3 py-2"
                    >
                      <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
                        {msg.from?.name || msg.from?.identity || 'Viewer'}
                      </Text>
                      <Text className="mt-1 text-sm leading-5 text-zinc-100">
                        {msg.message}
                      </Text>
                    </View>
                  )
                ))
              )}
            </ScrollView>

            <View className="mb-3 mt-2 flex-row items-center gap-2">
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSend}
                placeholder="Say something to the room..."
                placeholderTextColor="#71717a"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              />
              <Pressable
                onPress={handleSend}
                disabled={!text.trim()}
                className={`rounded-full px-4 py-2.5 ${
                  text.trim() ? 'bg-red-500' : 'bg-white/10'
                }`}
              >
                <Text className="text-sm font-semibold text-white">Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
