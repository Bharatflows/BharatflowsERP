export function exportToPDF(_data: any[], _filename: string): void {}
export function exportToExcel(_data: any[], _filename: string): void {}
export function exportToCSV(_data: any[], _filename: string): void {}
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN');
}