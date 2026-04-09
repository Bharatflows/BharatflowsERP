export function TrustScoreBadge({ score = 0 }: { score?: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-xs font-semibold ${color}`}>{score}%</span>;
}