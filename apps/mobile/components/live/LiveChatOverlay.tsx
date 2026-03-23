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
}: {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
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
        bottom: 6,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 12,
      }}
    >
      <View style={{ maxWidth: '76%' }} className="mb-2">
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          className="max-h-[180px]"
        >
          {messageCount === 0 ? (
            <View className="px-1 py-2">
              <Text className="text-sm text-white/75">
                Join the chat.
              </Text>
            </View>
          ) : (
            messages.slice(-6).map((msg, index) =>
              isReactionMessage(msg.message) ? (
                <View
                  key={`${msg.from?.identity || 'viewer'}-${index}`}
                  className="mb-2 flex-row items-center gap-2 px-1"
                >
                  <Text className="text-base">{msg.message.trim()}</Text>
                  <Text
                    numberOfLines={1}
                    className="flex-shrink text-[11px] font-semibold text-white"
                  >
                    {msg.from?.name || msg.from?.identity || 'Viewer'}
                  </Text>
                </View>
              ) : (
                <View
                  key={`${msg.from?.identity || 'viewer'}-${index}`}
                  className="mb-2 px-1"
                >
                  <Text
                    numberOfLines={1}
                    className="text-[11px] font-semibold text-white"
                  >
                    {msg.from?.name || msg.from?.identity || 'Viewer'}
                  </Text>
                  <Text
                    numberOfLines={2}
                    className="mt-0.5 text-sm leading-5 text-white/90"
                  >
                    {msg.message}
                  </Text>
                </View>
              ),
            )
          )}
        </ScrollView>
      </View>

      <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          placeholder="Comment"
          placeholderTextColor="#a1a1aa"
          className="flex-1 px-2 py-1 text-sm text-white"
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          className={`h-9 w-9 items-center justify-center rounded-full ${
            text.trim() ? 'bg-white/20' : 'bg-white/8'
          }`}
        >
          <Text className={`text-base font-semibold ${text.trim() ? 'text-white' : 'text-zinc-500'}`}>
            ↑
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
