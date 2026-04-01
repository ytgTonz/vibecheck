import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@vibecheck/shared';
import VibecheckIcon from '@/components/VibecheckIcon';

async function markOnboardingSeen() {
  await AsyncStorage.setItem('vc_onboarding_seen', 'true');
}

export default function GateScreen() {
  const router = useRouter();

  useEffect(() => {
    const user = useAuthStore.getState().user;
    if (user) {
      void markOnboardingSeen();
      router.replace('/');
    }
  }, [router]);

  const handleBrowse = async () => {
    await markOnboardingSeen();
    router.replace('/');
  };

  const handleSignIn = async () => {
    await markOnboardingSeen();
    router.push('/login');
  };

  const handleCreateAccount = async () => {
    await markOnboardingSeen();
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.skip, pressed && styles.btnPressed]}
        onPress={handleBrowse}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.top}>
        <VibecheckIcon size={80} />
        <Text style={styles.title}>
          {'VIBE'}<Text style={{ color: '#FF2D55' }}>{'CHECK'}</Text>
        </Text>
        <Text style={styles.tagline}>Feel the night.</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
          onPress={handleBrowse}
        >
          <Text style={styles.btnPrimaryText}>Browse venues</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.btnPressed]}
          onPress={handleSignIn}
        >
          <Text style={styles.btnSecondaryText}>Sign in</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnTertiary, pressed && styles.btnPressed]}
          onPress={handleCreateAccount}
        >
          <Text style={styles.btnTertiaryText}>Create account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 52,
    fontFamily: 'BebasNeue_400Regular',
    color: '#f4f4f5',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 15,
    color: '#71717a',
  },
  skip: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    color: '#52525b',
  },
  bottom: {
    paddingBottom: 12,
    gap: 12,
  },
  btn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnPrimary: {
    backgroundColor: '#f4f4f5',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#09090b',
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#d4d4d8',
  },
  btnTertiary: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  btnTertiaryText: {
    fontSize: 14,
    color: '#71717a',
  },
});
