interface PromoterFieldsProps {
  inviteCode: string;
  inputClass: string;
  onInviteCodeChange: (v: string) => void;
}

export function PromoterFields({ inviteCode, inputClass, onInviteCodeChange }: PromoterFieldsProps) {
  return (
    <div>
      <label htmlFor="inviteCode" className="mb-1 block text-sm text-zinc-400">Invite code</label>
      <input
        id="inviteCode" type="text" required value={inviteCode}
        onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
        className={inputClass} placeholder="e.g. A1B2C3D4" maxLength={8}
      />
      <p className="mt-1 text-xs text-zinc-500">Get this from the venue owner</p>
    </div>
  );
}
