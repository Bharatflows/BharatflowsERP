/**
 * Multi-Currency Service
 * 
 * P2: Currency conversion, exchange rates, and forex gain/loss
 */

import prisma from '../config/prisma';

// Major currencies commonly used in Indian trade
export const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

interface ExchangeRate {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    date: Date;
    source: 'MANUAL' | 'RBI' | 'API';
}

interface ConversionResult {
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    rateDate: Date;
}

interface ForexGainLoss {
    transactionId: string;
    originalAmount: number;
    currency: string;
    bookingRate: number;
    settlementRate: number;
    gainLoss: number;
    isGain: boolean;
}

class MultiCurrencyService {
    private defaultCurrency = 'INR';

    /**
     * Get current exchange rates (mock - should integrate with RBI/API)
     */
    async getExchangeRates(baseCurrency: string = 'INR'): Promise<ExchangeRate[]> {
        // Mock rates - in production, fetch from RBI or forex API
        const mockRates: Record<string, number> = {
            'USD': 83.25,
            'EUR': 90.50,
            'GBP': 105.75,
            'AED': 22.67,
            'SGD': 61.50,
            'JPY': 0.56,
            'CNY': 11.55,
        };

        return Object.entries(mockRates).map(([currency, rate]) => ({
            fromCurrency: currency,
            toCurrency: baseCurrency,
            rate,
            date: new Date(),
            source: 'API' as const
        }));
    }

    /**
     * Convert amount from one currency to another
     */
    async convertCurrency(
        amount: number,
        fromCurrency: string,
        toCurrency: string,
        rateDate?: Date
    ): Promise<ConversionResult> {
        // If same currency, return as is
        if (fromCurrency === toCurrency) {
            return {
                originalAmount: amount,
                originalCurrency: fromCurrency,
                convertedAmount: amount,
                targetCurrency: toCurrency,
                exchangeRate: 1,
                rateDate: rateDate || new Date()
            };
        }

        // Get rate (mock logic)
        const rates = await this.getExchangeRates();
        let exchangeRate = 1;

        if (toCurrency === 'INR') {
            // Converting TO INR
            const rateInfo = rates.find(r => r.fromCurrency === fromCurrency);
            exchangeRate = rateInfo?.rate || 1;
        } else if (fromCurrency === 'INR') {
            // Converting FROM INR
            const rateInfo = rates.find(r => r.fromCurrency === toCurrency);
            exchangeRate = rateInfo ? 1 / rateInfo.rate : 1;
        } else {
            // Cross-currency (via INR)
            const fromINRRate = rates.find(r => r.fromCurrency === fromCurrency)?.rate || 1;
            const toINRRate = rates.find(r => r.fromCurrency === toCurrency)?.rate || 1;
            exchangeRate = fromINRRate / toINRRate;
        }

        return {
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount: Math.round(amount * exchangeRate * 100) / 100,
            targetCurrency: toCurrency,
            exchangeRate,
            rateDate: rateDate || new Date()
        };
    }

    /**
     * Calculate forex gain/loss on settlement
     */
    calculateForexGainLoss(
        transactionId: string,
        originalAmount: number,
        currency: string,
        bookingRate: number,
        settlementRate: number
    ): ForexGainLoss {
        const bookingINR = originalAmount * bookingRate;
        const settlementINR = originalAmount * settlementRate;
        const difference = settlementINR - bookingINR;

        return {
            transactionId,
            originalAmount,
            currency,
            bookingRate,
            settlementRate,
            gainLoss: Math.abs(difference),
            isGain: difference > 0  // Gain if we pay less INR on settlement
        };
    }

    /**
     * Get currency symbol
     */
    getCurrencySymbol(code: string): string {
        const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
        return currency?.symbol || code;
    }

    /**
     * Format amount with currency
     */
    formatCurrency(amount: number, currency: string): string {
        const symbol = this.getCurrencySymbol(currency);
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Math.abs(amount));

        return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
    }

    /**
     * Get list of supported currencies
     */
    getSupportedCurrencies() {
        return SUPPORTED_CURRENCIES;
    }
}

export default new MultiCurrencyService();
