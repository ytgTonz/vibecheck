export function getVibeLabel(score: number): { label: string; textColor: string; bgColor: string } {
  if (score >= 80) return { label: 'On Fire', textColor: 'text-red-400', bgColor: 'bg-red-500/20' };
  if (score >= 50) return { label: 'Heating Up', textColor: 'text-orange-400', bgColor: 'bg-orange-500/20' };
  if (score >= 20) return { label: 'Warming Up', textColor: 'text-amber-400', bgColor: 'bg-amber-500/20' };
  return { label: 'Chill', textColor: 'text-zinc-500', bgColor: 'bg-zinc-800' };
}
