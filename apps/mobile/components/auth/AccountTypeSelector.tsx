import { Pressable, Text, View } from 'react-native';

interface AccountTypeSelectorProps {
  accountType: 'owner' | 'promoter' | null;
  onSelect: (type: 'owner' | 'promoter') => void;
}

const options = [
  {
    type: 'promoter' as const,
    emoji: '👀',
    label: 'Viewer',
    subtitle: 'Discover venues',
  },
  {
    type: 'owner' as const,
    emoji: '🏢',
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
            <Text className="text-4xl">{opt.emoji}</Text>
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
