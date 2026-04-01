import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AccountType = 'viewer' | 'promoter' | 'owner';

interface AccountTypeSelectorProps {
  accountType: AccountType | null;
  onSelect: (type: AccountType) => void;
}

const options: { type: AccountType; icon: string; label: string; subtitle: string }[] = [
  {
    type: 'viewer',
    icon: 'eye-outline',
    label: 'Viewer',
    subtitle: 'Browse & watch live',
  },
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
            className={`flex-1 rounded-[20px] border py-4 px-2 items-center gap-1.5 ${
              active ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <Ionicons
              name={opt.icon as any}
              size={28}
              color={active ? '#f4f4f5' : '#71717a'}
            />
            <Text className={`text-[13px] font-semibold mt-0.5 ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>
              {opt.label}
            </Text>
            <Text className={`text-[10px] text-center leading-tight ${active ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {opt.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
