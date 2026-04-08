import * as React from "react";

export default function VibecheckIcon({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="100" height="100" rx="22" fill="#FF2D55" />
      <path
        d="M22 24 L50 76 L78 24"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="67" cy="20" r="6" fill="#FFFFFF" />
    </svg>
  );
}

