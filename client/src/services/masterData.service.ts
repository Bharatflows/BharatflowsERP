export type BusinessType = 'manufacturer' | 'trader' | 'service' | 'retail';
export const masterDataService = {
  async getBusinessTypes() { return [] as BusinessType[]; },
  async getMasterData(_key: string) { return []; },
};