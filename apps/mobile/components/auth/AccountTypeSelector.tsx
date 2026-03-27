import { Pressable, Text, View } from 'react-native';

interface AccountTypeSelectorProps {
  accountType: 'owner' | 'promoter' | null;
  onSelect: (type: 'owner' | 'promoter') => void;
}

export function AccountTypeSelector({ accountType, onSelect }: AccountTypeSelectorProps) {
  return (
    <View className="mb-5 gap-3">
      <Pressable
        onPress={() => onSelect('owner')}
        className={`rounded-2xl border p-4 ${
          accountType === 'owner' ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-800 bg-zinc-900'
        }`}
      >
        <Text className="text-base font-semibold text-zinc-100">I own a venue</Text>
        <Text className="mt-1 text-sm text-zinc-400">Create your venue and manage your team.</Text>
      </Pressable>

      <Pressable
        onPress={() => onSelect('promoter')}
        className={`rounded-2xl border p-4 ${
          accountType === 'promoter'
            ? 'border-zinc-100 bg-zinc-100/10'
            : 'border-zinc-800 bg-zinc-900'
        }`}
      >
        <Text className="text-base font-semibold text-zinc-100">I have an invite code</Text>
        <Text className="mt-1 text-sm text-zinc-400">
          Join a venue as a promoter with an owner-issued code.
        </Text>
      </Pressable>
    </View>
  );
}
