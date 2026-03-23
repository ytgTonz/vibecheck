import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

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
  const lift = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.7)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(lift, {
          toValue: -10,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.16,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.32,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.35,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(ringOpacity, {
          toValue: 0.9,
          duration: 70,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(ringScale, {
          toValue: 1.7,
          duration: 290,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onReact(reaction);
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: lift }, { scale }],
      }}
    >
      {vertical ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              right: 6,
              bottom: 6,
              borderRadius: 999,
              backgroundColor: '#fb923c',
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.9)',
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            }}
          />
        </>
      ) : null}
      <Pressable
        onPress={handlePress}
        hitSlop={12}
        className={
          vertical
            ? 'h-14 w-14 items-center justify-center rounded-full bg-black/30'
            : 'rounded-full border border-white/10 bg-black/55 px-3 py-2'
        }
      >
        <Animated.Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -6,
            right: -2,
            opacity: sparkleOpacity,
            fontSize: 10,
          }}
        >
          ✦
        </Animated.Text>
        <Text className={vertical ? 'text-xl' : 'text-lg'}>{reaction}</Text>
      </Pressable>
    </Animated.View>
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
        backgroundColor: 'transparent',
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
