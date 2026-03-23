import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

export const QUICK_REACTIONS = ['🔥', '😍', '🕺', '🍾', '👏'] as const;

export type FloatingReaction = {
  id: number;
  emoji: string;
  left: number;
  bottom: number;
  size: number;
  drift: number;
  duration: number;
};

export function isReactionMessage(message: string) {
  return QUICK_REACTIONS.includes(message.trim() as (typeof QUICK_REACTIONS)[number]);
}

export function QuickReactionRow({
  onReact,
  vertical = false,
}: {
  onReact: (reaction: string) => void;
  vertical?: boolean;
}) {
  return (
    <View className={vertical ? 'items-center gap-2' : 'flex-row flex-wrap gap-2'}>
      {QUICK_REACTIONS.map((reaction) => (
        <Pressable
          key={reaction}
          onPress={() => onReact(reaction)}
          className={`rounded-full border border-white/10 bg-black/55 ${
            vertical ? 'h-11 w-11 items-center justify-center' : 'px-3 py-2'
          }`}
        >
          <Text className="text-lg">{reaction}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function FloatingReactionBubble({
  bubble,
  onDone,
}: {
  bubble: FloatingReaction;
  onDone: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: bubble.duration - 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -260,
        duration: bubble.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: bubble.drift,
        duration: bubble.duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.12,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: Math.max(220, bubble.duration - 260),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone(bubble.id));
  }, [bubble, onDone, opacity, scale, translateX, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: bubble.left,
        bottom: bubble.bottom,
        width: bubble.size,
        height: bubble.size,
        borderRadius: bubble.size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 10, 12, 0.62)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    >
      <Text style={{ fontSize: bubble.size * 0.48 }}>{bubble.emoji}</Text>
    </Animated.View>
  );
}

export function FloatingReactionLayer({
  reactions,
  onDone,
}: {
  reactions: FloatingReaction[];
  onDone: (id: number) => void;
}) {
  return (
    <View pointerEvents="none" className="absolute inset-0 z-[6]">
      {reactions.map((reaction) => (
        <FloatingReactionBubble
          key={reaction.id}
          bubble={reaction}
          onDone={onDone}
        />
      ))}
    </View>
  );
}
