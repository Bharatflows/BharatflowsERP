/// <reference types="jest" />
import { gstRuleService } from '../gstRuleService';
import { Prisma } from '@prisma/client';

describe('GST Rule Service', () => {
    describe('calculateLineItem', () => {
        it('should calculate Intra-State GST (CGST + SGST)', () => {
            const input = {
                taxableValue: 1000,
                gstRate: 18,
                placeOfSupplyState: 'Maharashtra',
                companyState: 'Maharashtra'
            };

            const result = gstRuleService.calculateLineItem(input);

            expect(result.cgst.toNumber()).toBe(90); // 9%
            expect(result.sgst.toNumber()).toBe(90); // 9%
            expect(result.igst.toNumber()).toBe(0);
            expect(result.taxAmount.toNumber()).toBe(180);
            expect(result.totalAmount.toNumber()).toBe(1180);
        });

        it('should calculate Inter-State GST (IGST)', () => {
            const input = {
                taxableValue: 1000,
                gstRate: 18,
                placeOfSupplyState: 'Karnataka',
                companyState: 'Maharashtra'
            };

            const result = gstRuleService.calculateLineItem(input);

            expect(result.cgst.toNumber()).toBe(0);
            expect(result.sgst.toNumber()).toBe(0);
            expect(result.igst.toNumber()).toBe(180); // 18%
            expect(result.taxAmount.toNumber()).toBe(180);
            expect(result.totalAmount.toNumber()).toBe(1180);
        });

        it('should handle SEZ supply as Inter-State (IGST)', () => {
            const input = {
                taxableValue: 1000,
                gstRate: 18,
                placeOfSupplyState: 'Maharashtra', // Same state
                companyState: 'Maharashtra',
                isSEZ: true
            };

            const result = gstRuleService.calculateLineItem(input);

            expect(result.igst.toNumber()).toBe(180);
            expect(result.cgst.toNumber()).toBe(0);
        });

        it('should handle Exports as Inter-State (IGST)', () => {
            const input = {
                taxableValue: 1000,
                gstRate: 18,
                placeOfSupplyState: 'Outside India',
                companyState: 'Maharashtra',
                isExport: true
            };

            const result = gstRuleService.calculateLineItem(input);

            expect(result.igst.toNumber()).toBe(180);
        });

        it('should calculate Cess if provided', () => {
            const input = {
                taxableValue: 1000,
                gstRate: 18,
                cessRate: 1,
                placeOfSupplyState: 'Maharashtra',
                companyState: 'Maharashtra'
            };

            const result = gstRuleService.calculateLineItem(input);

            expect(result.cess.toNumber()).toBe(10); // 1%
            expect(result.totalAmount.toNumber()).toBe(1190);
        });
    });

    describe('calculateBackwards', () => {
        it('should reverse calculate taxable value from total', () => {
            // Total = 118, Rate = 18. Taxable should be 100.
            const total = 118;
            const rate = 18;

            const result = gstRuleService.calculateBackwards(total, rate, 'Maharashtra', 'Maharashtra');

            expect(result.taxableValue.toNumber()).toBeCloseTo(100, 2);
            expect(result.taxAmount.toNumber()).toBeCloseTo(18, 2);
            expect(result.totalAmount.toNumber()).toBe(118);
        });
    });

    describe('getStateCodeFromGSTIN', () => {
        it('should extract first 2 digits', () => {
            expect(gstRuleService.getStateCodeFromGSTIN('27ABCDE1234F1Z5')).toBe('27');
        });

        it('should return null for invalid GSTIN', () => {
            expect(gstRuleService.getStateCodeFromGSTIN('')).toBeNull();
            expect(gstRuleService.getStateCodeFromGSTIN('A')).toBeNull();
        });
    });
});
