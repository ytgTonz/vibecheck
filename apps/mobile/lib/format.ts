/** Format a number in compact notation (e.g. 1.2K, 3M). */
export function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}
