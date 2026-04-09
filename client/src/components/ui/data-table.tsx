import { ReactNode } from 'react';
export function DataTable({ data = [], columns = [], ..._ }: any) {
  return <div className="rounded-md border"><table className="w-full"><tbody>{data.map((_r: any, i: number) => <tr key={i}></tr>)}</tbody></table></div>;
}