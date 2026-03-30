import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export function PulseDot({ live }: { live: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!live) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [live]);

  if (!live) return <View className="h-2.5 w-2.5 rounded-full bg-zinc-500" />;

  return (
    <View className="h-2.5 w-2.5 items-center justify-center">
      <Animated.View
        className="absolute h-2.5 w-2.5 rounded-full bg-brand-red"
        style={{ transform: [{ scale }], opacity }}
      />
      <View className="h-2.5 w-2.5 rounded-full bg-brand-red" />
    </View>
  );
}
