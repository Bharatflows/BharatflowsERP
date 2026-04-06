import prisma from '../config/prisma';
import logger from '../config/logger';

export const currencyService = {
  /**
   * Get all enabled currencies for a company
   */
  getCurrencies: async (companyId: string) => {
    return await prisma.currency.findMany({
      where: { companyId, isActive: true },
    });
  },

  /**
   * Get the base currency for a company
   */
  getBaseCurrency: async (companyId: string) => {
    return await prisma.currency.findFirst({
      where: { companyId, isBaseCurrency: true },
    });
  },

  /**
   * Update or create an exchange rate
   */
  updateExchangeRate: async (companyId: string, currencyCode: string, rate: number, date: Date = new Date()) => {
    const currency = await prisma.currency.findUnique({
      where: { companyId_code: { companyId, code: currencyCode } },
    });

    if (!currency) {
      throw new Error(`Currency ${currencyCode} not found`);
    }

    // Normalize date to start of day
    const rateDate = new Date(date);
    rateDate.setHours(0, 0, 0, 0);

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        currencyId_date: {
          currencyId: currency.id,
          date: rateDate,
        },
      },
      update: { rate, companyId },
      create: {
        companyId,
        currencyId: currency.id,
        date: rateDate,
        rate,
      },
    });

    logger.info(`Updated exchange rate for ${currencyCode}: ${rate}`);
    return exchangeRate;
  },

  /**
   * Convert an amount from one currency to another
   */
  convert: async (companyId: string, amount: number, fromCode: string, toCode: string, date: Date = new Date()) => {
    if (fromCode === toCode) return amount;

    const baseCurrency = await prisma.currency.findFirst({
      where: { companyId, isBaseCurrency: true },
    });

    if (!baseCurrency) throw new Error('Base currency not set');

    // Get rates relative to base currency
    const rateDate = new Date(date);
    rateDate.setHours(0, 0, 0, 0);

    let fromRate = 1;
    let toRate = 1;

    if (fromCode !== baseCurrency.code) {
      const fromCurrency = await prisma.currency.findUnique({ where: { companyId_code: { companyId, code: fromCode } } });
      if (!fromCurrency) throw new Error(`Currency ${fromCode} not found`);

      const rateRecord = await prisma.exchangeRate.findFirst({
        where: { companyId, currencyId: fromCurrency.id, date: { lte: rateDate } },
        orderBy: { date: 'desc' },
      });
      if (!rateRecord) throw new Error(`Exchange rate not found for ${fromCode}`);
      fromRate = Number(rateRecord.rate);
    }

    if (toCode !== baseCurrency.code) {
      const toCurrency = await prisma.currency.findUnique({ where: { companyId_code: { companyId, code: toCode } } });
      if (!toCurrency) throw new Error(`Currency ${toCode} not found`);

      const rateRecord = await prisma.exchangeRate.findFirst({
        where: { companyId, currencyId: toCurrency.id, date: { lte: rateDate } },
        orderBy: { date: 'desc' },
      });
      if (!rateRecord) throw new Error(`Exchange rate not found for ${toCode}`);
      toRate = Number(rateRecord.rate);
    }

    // Conversion logic:
    // Amount (From) * FromRate = Amount (Base)
    // Amount (Base) / ToRate = Amount (To)

    // Example: 
    // Base = INR
    // USD rate = 80 (1 USD = 80 INR)
    // EUR rate = 90 (1 EUR = 90 INR)
    // Convert 100 USD to EUR:
    // 100 * 80 = 8000 INR
    // 8000 / 90 = 88.88 EUR

    const amountInBase = amount * fromRate;
    const amountInTarget = amountInBase / toRate;

    return Number(amountInTarget.toFixed(4));
  }
};
