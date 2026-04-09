export function StatsCard({ title, value, ..._ }: any) {
  return <div className="card-base p-4"><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold">{value}</p></div>;
}
export function StatsCardSkeleton() { return <div className="card-base p-4 animate-pulse h-24" />; }