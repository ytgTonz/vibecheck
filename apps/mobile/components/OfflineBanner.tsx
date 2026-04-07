import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/contexts/NetworkContext';

export default function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const isVisible = useRef(false);

  useEffect(() => {
    if (!isConnected && !isVisible.current) {
      isVisible.current = true;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else if (isConnected && isVisible.current) {
      // Brief delay so the user sees "Back online" before it hides
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          isVisible.current = false;
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, translateY]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: 16,
          backgroundColor: isConnected ? '#166534' : '#7f1d1d',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 13, color: '#fafafa', fontWeight: '600' }}>
          {isConnected ? 'Back online' : 'No internet connection'}
        </Text>
      </View>
    </Animated.View>
  );
}
