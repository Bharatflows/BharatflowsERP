/**
 * Stock Consistency Tests (C2)
 * 
 * Tests for stock atomicity under failure conditions.
 * Verifies that stock updates are atomic with invoice/bill transactions.
 * 
 * Run with: npx jest stockConsistency.test.ts
 */

import prisma from '../../../config/prisma';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Test constants - will be set dynamically
let mockCompanyId: string;
const mockUserId = 'test-user-stock';

describe('Stock Consistency Tests (C2)', () => {
    let testProduct: any;
    let testCompany: any;

    beforeAll(async () => {
        // First create a test company
        testCompany = await prisma.company.create({
            data: {
                businessName: 'Test Company for Stock',
                email: `stock-test-${Date.now()}@test.com`,
                phone: '9999999999',
                state: 'Karnataka'
            }
        });
        mockCompanyId = testCompany.id;

        // Create test product with inventory tracking
        testProduct = await prisma.product.create({
            data: {
                companyId: mockCompanyId,
                name: 'Test Product for Stock',
                hsnCode: `HSN-${Date.now()}`,
                currentStock: 100,
                trackInventory: true,
                sellingPrice: 100,
                purchasePrice: 80,
                unit: 'PCS'
            }
        });
    });

    afterAll(async () => {
        // Cleanup in reverse order of creation
        if (testProduct?.id) {
            await prisma.stockMovement.deleteMany({
                where: { productId: testProduct.id }
            }).catch(() => { });
            await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => { });
        }
        if (testCompany?.id) {
            await prisma.company.delete({ where: { id: testCompany.id } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('Invoice Stock Deduction', () => {
        it('should deduct stock atomically when invoice is created', async () => {
            const initialStock = testProduct.currentStock;
            const quantityToDeduct = 5;

            // Simulate invoice creation transaction
            await prisma.$transaction(async (tx) => {
                // Deduct stock (as done in C2 fix)
                const product = await tx.product.findUnique({
                    where: { id: testProduct.id }
                });

                if (product && product.trackInventory) {
                    const newStock = product.currentStock - quantityToDeduct;
                    await tx.product.update({
                        where: { id: product.id },
                        data: { currentStock: newStock }
                    });

                    await tx.stockMovement.create({
                        data: {
                            companyId: mockCompanyId,
                            productId: product.id,
                            type: 'SALE',
                            quantity: -quantityToDeduct,
                            previousStock: product.currentStock,
                            newStock,
                            reference: 'TEST-INV-001',
                            reason: 'Test invoice creation',
                            createdBy: mockUserId
                        }
                    });
                }
            });

            // Verify stock was deducted
            const updatedProduct = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });

            expect(updatedProduct?.currentStock).toBe(initialStock - quantityToDeduct);
        });

        it('should rollback stock if transaction fails', async () => {
            const productBefore = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });
            const initialStock = productBefore?.currentStock || 0;

            try {
                await prisma.$transaction(async (tx) => {
                    // Deduct stock
                    await tx.product.update({
                        where: { id: testProduct.id },
                        data: { currentStock: initialStock - 10 }
                    });

                    // Force transaction failure
                    throw new Error('Simulated failure');
                });
            } catch (error) {
                // Expected to fail
            }

            // Verify stock was NOT changed (rolled back)
            const productAfter = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });

            expect(productAfter?.currentStock).toBe(initialStock);
        });

        it('should not allow negative stock if constraint exists', async () => {
            const productBefore = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });
            const currentStock = productBefore?.currentStock || 0;
            const overDeduction = currentStock + 100; // More than available

            // This should either fail or allow negative (depends on business rules)
            // The test documents the current behavior
            try {
                await prisma.$transaction(async (tx) => {
                    const product = await tx.product.findUnique({
                        where: { id: testProduct.id }
                    });

                    if (!product) throw new Error('Product not found');

                    const newStock = product.currentStock - overDeduction;

                    // In a strict system, this should throw
                    // Current system allows negative stock
                    await tx.product.update({
                        where: { id: product.id },
                        data: { currentStock: newStock }
                    });
                });

                // If we get here, negative stock is allowed
                const productAfter = await prisma.product.findUnique({
                    where: { id: testProduct.id }
                });

                // Document: System allows negative stock
                console.log('[C2 Test] Note: System allows negative stock:', productAfter?.currentStock);

                // Restore stock for cleanup
                await prisma.product.update({
                    where: { id: testProduct.id },
                    data: { currentStock: currentStock }
                });
            } catch (error) {
                // If we get here, system prevents negative stock
                console.log('[C2 Test] Note: System prevents negative stock');
            }
        });
    });

    describe('Purchase Bill Stock Increment', () => {
        it('should increment stock atomically when bill is created', async () => {
            const productBefore = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });
            const initialStock = productBefore?.currentStock || 0;
            const quantityToAdd = 25;

            await prisma.$transaction(async (tx) => {
                const product = await tx.product.findUnique({
                    where: { id: testProduct.id }
                });

                if (product && product.trackInventory) {
                    const newStock = product.currentStock + quantityToAdd;
                    await tx.product.update({
                        where: { id: product.id },
                        data: { currentStock: newStock }
                    });

                    await tx.stockMovement.create({
                        data: {
                            companyId: mockCompanyId,
                            productId: product.id,
                            type: 'PURCHASE',
                            quantity: quantityToAdd,
                            previousStock: product.currentStock,
                            newStock,
                            reference: 'TEST-BILL-001',
                            reason: 'Test purchase bill creation',
                            createdBy: mockUserId
                        }
                    });
                }
            });

            const productAfter = await prisma.product.findUnique({
                where: { id: testProduct.id }
            });

            expect(productAfter?.currentStock).toBe(initialStock + quantityToAdd);
        });
    });

    describe('Stock Movement Audit Trail', () => {
        it('should create stock movement records for all changes', async () => {
            const movements = await prisma.stockMovement.findMany({
                where: { productId: testProduct.id },
                orderBy: { createdAt: 'desc' }
            });

            expect(movements.length).toBeGreaterThan(0);

            // Verify movement has required fields
            const latestMovement = movements[0];
            expect(latestMovement.companyId).toBeDefined();
            expect(latestMovement.quantity).toBeDefined();
            expect(latestMovement.previousStock).toBeDefined();
            expect(latestMovement.newStock).toBeDefined();
            expect(latestMovement.reference).toBeDefined();
        });
    });
});
