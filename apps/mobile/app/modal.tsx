import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-zinc-950">
      <Text className="text-xl font-bold text-zinc-100">Modal</Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
