interface ViewerFieldsProps {
  phone: string;
  inputClass: string;
  onPhoneChange: (value: string) => void;
}

export function ViewerFields({ phone, inputClass, onPhoneChange }: ViewerFieldsProps) {
  return (
    <div>
      <label htmlFor="phone" className="mb-1 block text-sm text-zinc-400">Phone number</label>
      <input
        id="phone"
        type="tel"
        required
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className={inputClass}
        placeholder="e.g. 0812345678"
      />
      <p className="mt-1 text-xs text-zinc-500">We&apos;ll send a verification code to this number</p>
    </div>
  );
}
