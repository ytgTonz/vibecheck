import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export const QUICK_REACTIONS = ['🔥'] as const;

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
        <QuickReactionButton
          key={reaction}
          reaction={reaction}
          vertical={vertical}
          onReact={onReact}
        />
      ))}
    </View>
  );
}

function QuickReactionButton({
  reaction,
  onReact,
  vertical,
}: {
  reaction: string;
  onReact: (reaction: string) => void;
  vertical: boolean;
}) {
  const emojiScale = useSharedValue(1);
  const emojiTranslateY = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: emojiTranslateY.value }, { scale: emojiScale.value }],
  }));

  const fireOnce = useCallback(() => {
    cancelAnimation(emojiScale);
    cancelAnimation(emojiTranslateY);
    emojiScale.value = 1;
    emojiTranslateY.value = 0;

    emojiTranslateY.value = withSequence(
      withTiming(-6, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 100, easing: Easing.inOut(Easing.quad) }),
    );
    emojiScale.value = withSequence(
      withTiming(1.3, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 12, stiffness: 150 }),
    );
    onReact(reaction);
  }, [onReact, reaction, emojiScale, emojiTranslateY]);

  const stopFiring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startFiring = useCallback(() => {
    fireOnce();
    intervalRef.current = setInterval(fireOnce, 120);
  }, [fireOnce]);

  useEffect(() => stopFiring, [stopFiring]);

  return (
    <Pressable
      onPress={fireOnce}
      onLongPress={startFiring}
      onPressOut={stopFiring}
      delayLongPress={200}
      hitSlop={12}
      className={
        vertical
          ? 'h-14 w-14 items-center justify-center rounded-full bg-black/30'
          : 'rounded-full border border-white/10 bg-black/55 px-3 py-2'
      }
    >
      <Animated.Text style={emojiStyle} className={vertical ? 'text-xl' : 'text-lg'}>
        {reaction}
      </Animated.Text>
    </Pressable>
  );
}

function FloatingReactionBubble({
  bubble,
  onDone,
}: {
  bubble: FloatingReaction;
  onDone: (id: number) => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.7);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: bubble.left,
    bottom: bubble.bottom,
    width: bubble.size,
    height: bubble.size,
    borderRadius: bubble.size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    const fadeOutStart = 180;
    const fadeOutDuration = bubble.duration - fadeOutStart;

    opacity.value = withSequence(
      withTiming(1, { duration: fadeOutStart, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: fadeOutDuration, easing: Easing.in(Easing.quad) }),
    );
    translateY.value = withTiming(-260, {
      duration: bubble.duration,
      easing: Easing.out(Easing.cubic),
    });
    translateX.value = withTiming(bubble.drift, {
      duration: bubble.duration,
      easing: Easing.inOut(Easing.sin),
    });
    scale.value = withSequence(
      withSpring(1.12, { damping: 8, stiffness: 90 }),
      withDelay(
        0,
        withTiming(0.92, {
          duration: Math.max(220, bubble.duration - 260),
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    const timeout = setTimeout(() => onDone(bubble.id), bubble.duration);
    return () => clearTimeout(timeout);
  }, [bubble, onDone, opacity, scale, translateX, translateY]);

  return (
    <Animated.View pointerEvents="none" style={animatedStyle}>
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
