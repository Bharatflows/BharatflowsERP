import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { currencyService } from '../../services/currencyService';
import logger from '../../config/logger';

/**
 * Get all currencies for a company
 */
export const getCurrencies = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const currencies = await currencyService.getCurrencies(companyId);
    res.json({ success: true, data: currencies });
  } catch (error: any) {
    logger.error('Error fetching currencies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/*
export const getCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const currency = await currencyService.getCurrencyById(id, companyId);

    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }

    return res.json({ success: true, data: currency });
  } catch (error: any) {
    logger.error('Error fetching currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/**
 * Get base currency for a company
 */
export const getBaseCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const currency = await currencyService.getBaseCurrency(companyId);

    if (!currency) {
      return res.status(404).json({ success: false, message: 'Base currency not configured' });
    }

    return res.json({ success: true, data: currency });
  } catch (error: any) {
    logger.error('Error fetching base currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/*
export const createCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { code, name, symbol, decimalPlaces, exchangeRate, isBaseCurrency } = req.body;

    if (!code || !name || !symbol) {
      return res.status(400).json({ success: false, message: 'Code, name, and symbol are required' });
    }

    const currency = await currencyService.createCurrency(companyId, {
      code,
      name,
      symbol,
      decimalPlaces,
      exchangeRate,
      isBaseCurrency,
    });

    return res.status(201).json({ success: true, data: currency });
  } catch (error: any) {
    logger.error('Error creating currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const updateCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { name, symbol, decimalPlaces, exchangeRate, isActive } = req.body;

    const currency = await currencyService.updateCurrency(id, companyId, {
      name,
      symbol,
      decimalPlaces,
      exchangeRate,
      isActive,
    });

    return res.json({ success: true, data: currency });
  } catch (error: any) {
    logger.error('Error updating currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const setBaseCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    const currency = await currencyService.setBaseCurrency(id, companyId);

    return res.json({ success: true, data: currency, message: 'Base currency updated' });
  } catch (error: any) {
    logger.error('Error setting base currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const deleteCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;

    await currencyService.deleteCurrency(id, companyId);

    return res.json({ success: true, message: 'Currency deleted' });
  } catch (error: any) {
    logger.error('Error deleting currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const updateExchangeRate = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const userId = req.user!.id;
    const { id } = req.params;
    const { rate, date, source } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({ success: false, message: 'Valid exchange rate is required' });
    }

    const exchangeRate = await currencyService.updateExchangeRate(
      id,
      companyId,
      rate,
      date ? new Date(date) : undefined,
      source || 'MANUAL',
      userId
    );

    return res.json({ success: true, data: exchangeRate });
  } catch (error: any) {
    logger.error('Error updating exchange rate:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const getExchangeRateHistory = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { id } = req.params;
    const { startDate, endDate, limit } = req.query;

    const history = await currencyService.getExchangeRateHistory(
      id,
      companyId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      limit ? parseInt(limit as string) : 100
    );

    return res.json({ success: true, data: history });
  } catch (error: any) {
    logger.error('Error fetching exchange rate history:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const convertAmount = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const { amount, fromCurrencyId, toCurrencyId, date } = req.body;

    if (!amount || !fromCurrencyId || !toCurrencyId) {
      return res.status(400).json({ success: false, message: 'Amount, fromCurrencyId, and toCurrencyId are required' });
    }

    const result = await currencyService.convertAmount(
      amount,
      fromCurrencyId,
      toCurrencyId,
      date ? new Date(date) : undefined
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error converting amount:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const convertToBaseCurrency = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { amount, fromCurrencyId, date } = req.body;

    if (!amount || !fromCurrencyId) {
      return res.status(400).json({ success: false, message: 'Amount and fromCurrencyId are required' });
    }

    const result = await currencyService.convertToBaseCurrency(
      amount,
      fromCurrencyId,
      companyId,
      date ? new Date(date) : undefined
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error converting to base currency:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const initializeDefaultCurrencies = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { baseCurrencyCode } = req.body;

    await currencyService.initializeDefaultCurrencies(companyId, baseCurrencyCode || 'INR');

    return res.json({ success: true, message: 'Default currencies initialized' });
  } catch (error: any) {
    logger.error('Error initializing currencies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const getCommonCurrencies = async (_req: AuthRequest, res: Response) => {
  try {
    const currencies = currencyService.getCommonCurrencies();
    res.json({ success: true, data: currencies });
  } catch (error: any) {
    logger.error('Error fetching common currencies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
*/

/*
export const calculateForexGainLoss = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  try {
    const companyId = req.user!.companyId;
    const { originalAmount, originalCurrencyId, originalDate, settlementDate } = req.body;

    if (!originalAmount || !originalCurrencyId || !originalDate || !settlementDate) {
      return res.status(400).json({
        success: false,
        message: 'originalAmount, originalCurrencyId, originalDate, and settlementDate are required',
      });
    }

    const result = await currencyService.calculateForexGainLoss(
      originalAmount,
      originalCurrencyId,
      new Date(originalDate),
      new Date(settlementDate),
      companyId
    );

    return res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error calculating forex gain/loss:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
*/

export default {
  getCurrencies,
  // getCurrency,
  getBaseCurrency,
  // createCurrency,
  // updateCurrency,
  // setBaseCurrency,
  // deleteCurrency,
  // updateExchangeRate,
  // getExchangeRateHistory,
  // convertAmount,
  // convertToBaseCurrency,
  // initializeDefaultCurrencies,
  // getCommonCurrencies,
  // calculateForexGainLoss,
};
