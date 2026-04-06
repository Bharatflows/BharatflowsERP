/**
 * Supplier Dependency Analysis Service
 * 
 * P2: Risk analysis based on supplier concentration
 */

import prisma from '../config/prisma';
import { subMonths, startOfMonth } from 'date-fns';

interface SupplierConcentration {
    supplierId: string;
    supplierName: string;
    totalPurchases: number;
    purchasePercent: number;
    invoiceCount: number;
    avgOrderValue: number;
    isMSME: boolean;
    msmeType?: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface DependencyAnalysis {
    totalPurchases: number;
    supplierCount: number;
    topSuppliers: SupplierConcentration[];
    concentrationIndex: number; // Herfindahl-Hirschman Index (0-1)
    riskAssessment: {
        level: string;
        message: string;
        recommendations: string[];
    };
}

class SupplierDependencyService {
    /**
     * Analyze supplier concentration risk
     */
    async analyzeConcentration(
        companyId: string,
        months: number = 12
    ): Promise<DependencyAnalysis> {
        const startDate = subMonths(startOfMonth(new Date()), months);

        // Get all purchase bills grouped by supplier
        const purchases = await prisma.purchaseBill.groupBy({
            by: ['supplierId'],
            where: {
                companyId,
                billDate: { gte: startDate },
                deletedAt: null
            },
            _sum: { totalAmount: true },
            _count: { id: true }
        });

        // Get supplier details
        const supplierIds = purchases.map(p => p.supplierId);
        const suppliers = await prisma.party.findMany({
            where: { id: { in: supplierIds } },
            select: {
                id: true,
                name: true,
                msmeType: true,
                udyamNumber: true
            }
        });

        const supplierMap = new Map(suppliers.map(s => [s.id, s]));

        // Calculate total
        const totalPurchases = purchases.reduce(
            (sum, p) => sum + (Number(p._sum.totalAmount) || 0),
            0
        );

        // Calculate concentration for each supplier
        const concentrations: SupplierConcentration[] = purchases.map(purchase => {
            const supplier = supplierMap.get(purchase.supplierId);
            const amount = Number(purchase._sum.totalAmount) || 0;
            const percent = totalPurchases > 0 ? (amount / totalPurchases) * 100 : 0;

            // Risk level based on concentration
            let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
            if (percent >= 50) riskLevel = 'CRITICAL';
            else if (percent >= 30) riskLevel = 'HIGH';
            else if (percent >= 15) riskLevel = 'MEDIUM';

            return {
                supplierId: purchase.supplierId,
                supplierName: supplier?.name || 'Unknown',
                totalPurchases: amount,
                purchasePercent: Math.round(percent * 10) / 10,
                invoiceCount: purchase._count.id,
                avgOrderValue: purchase._count.id > 0 ? amount / purchase._count.id : 0,
                isMSME: !!supplier?.msmeType,
                msmeType: supplier?.msmeType || undefined,
                riskLevel
            };
        });

        // Sort by purchase amount
        concentrations.sort((a, b) => b.totalPurchases - a.totalPurchases);

        // Calculate Herfindahl-Hirschman Index (HHI)
        // HHI = sum of squared market shares (0-1 scale)
        const hhi = concentrations.reduce((sum, c) => {
            const share = c.purchasePercent / 100;
            return sum + (share * share);
        }, 0);

        // Risk assessment
        const riskAssessment = this.assessRisk(concentrations, hhi);

        return {
            totalPurchases,
            supplierCount: concentrations.length,
            topSuppliers: concentrations.slice(0, 10),
            concentrationIndex: Math.round(hhi * 1000) / 1000,
            riskAssessment
        };
    }

    /**
     * Assess overall risk based on concentration
     */
    private assessRisk(
        suppliers: SupplierConcentration[],
        hhi: number
    ): DependencyAnalysis['riskAssessment'] {
        const recommendations: string[] = [];
        let level = 'LOW';
        let message = 'Supplier base is well diversified';

        // Check HHI thresholds
        if (hhi >= 0.25) {
            level = 'CRITICAL';
            message = 'High supplier concentration risk';
            recommendations.push('Urgently diversify supplier base');
        } else if (hhi >= 0.15) {
            level = 'HIGH';
            message = 'Moderate-high concentration risk';
            recommendations.push('Consider adding alternative suppliers');
        } else if (hhi >= 0.08) {
            level = 'MEDIUM';
            message = 'Moderate concentration';
            recommendations.push('Monitor top suppliers closely');
        }

        // Check for single dominant supplier
        const topSupplier = suppliers[0];
        if (topSupplier && topSupplier.purchasePercent > 40) {
            recommendations.push(`Reduce dependency on ${topSupplier.supplierName}`);
        }

        // Check MSME concentration
        const msmeSuppliers = suppliers.filter(s => s.isMSME);
        const msmePercent = msmeSuppliers.reduce((sum, s) => sum + s.purchasePercent, 0);
        if (msmePercent > 60) {
            recommendations.push('High MSME exposure - ensure 45-day payment compliance');
        }

        // Non-diversified (fewer than 5 suppliers)
        if (suppliers.length < 5) {
            recommendations.push('Consider expanding supplier network for resilience');
        }

        return {
            level,
            message,
            recommendations
        };
    }

    /**
     * Get suppliers needing attention
     */
    async getSuppliersNeedingAttention(
        companyId: string
    ): Promise<Array<{
        supplierId: string;
        supplierName: string;
        issue: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>> {
        const analysis = await this.analyzeConcentration(companyId, 6);
        const attention = [];

        for (const supplier of analysis.topSuppliers) {
            if (supplier.riskLevel === 'CRITICAL') {
                attention.push({
                    supplierId: supplier.supplierId,
                    supplierName: supplier.supplierName,
                    issue: `${supplier.purchasePercent}% of purchases - over-dependent`,
                    priority: 'HIGH' as const
                });
            } else if (supplier.isMSME && supplier.purchasePercent > 10) {
                attention.push({
                    supplierId: supplier.supplierId,
                    supplierName: supplier.supplierName,
                    issue: 'MSME supplier - ensure 45-day payment compliance',
                    priority: 'MEDIUM' as const
                });
            }
        }

        return attention;
    }
}

export default new SupplierDependencyService();
