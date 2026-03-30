import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccountTypeSelectorProps {
  accountType: 'owner' | 'promoter' | null;
  onSelect: (type: 'owner' | 'promoter') => void;
}

const options: { type: 'owner' | 'promoter'; icon: string; label: string; subtitle: string }[] = [
  {
    type: 'promoter',
    icon: 'radio-outline',
    label: 'Promoter',
    subtitle: 'Broadcast for venues',
  },
  {
    type: 'owner',
    icon: 'business-outline',
    label: 'Venue owner',
    subtitle: 'List & stream',
  },
];

export function AccountTypeSelector({ accountType, onSelect }: AccountTypeSelectorProps) {
  return (
    <View className="flex-row gap-3 mb-5">
      {options.map((opt) => {
        const active = accountType === opt.type;
        return (
          <Pressable
            key={opt.type}
            onPress={() => onSelect(opt.type)}
            className={`flex-1 rounded-[20px] border py-6 px-4 items-center gap-2 ${
              active ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <Ionicons
              name={opt.icon as any}
              size={32}
              color={active ? '#f4f4f5' : '#71717a'}
            />
            <Text className={`text-[15px] font-semibold mt-1 ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>
              {opt.label}
            </Text>
            <Text className={`text-xs text-center ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {opt.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
