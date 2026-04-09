export function AdaptiveTable({ data = [], columns = [], ..._ }: any) {
  return <div className="rounded-md border overflow-auto"><table className="w-full text-sm"><thead><tr>{columns.map((c: any, i: number) => <th key={i} className="p-2 text-left">{c.header || c.accessorKey}</th>)}</tr></thead><tbody>{data.map((_r: any, i: number) => <tr key={i} className="border-t" />)}</tbody></table></div>;
}