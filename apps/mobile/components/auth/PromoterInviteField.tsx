import { TextInput } from 'react-native';

interface PromoterInviteFieldProps {
  inviteCode: string;
  onInviteCodeChange: (v: string) => void;
}

export function PromoterInviteField({ inviteCode, onInviteCodeChange }: PromoterInviteFieldProps) {
  return (
    <TextInput
      value={inviteCode}
      onChangeText={onInviteCodeChange}
      autoCapitalize="characters"
      placeholder="Invite code"
      placeholderTextColor="#71717a"
      className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
    />
  );
}
