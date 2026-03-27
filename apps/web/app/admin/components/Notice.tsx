interface NoticeProps {
  type: "success" | "error";
  message: string;
}

export function Notice({ type, message }: NoticeProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        type === "success"
          ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
          : "border-red-900/50 bg-red-950/30 text-red-400"
      }`}
    >
      {message}
    </div>
  );
}
