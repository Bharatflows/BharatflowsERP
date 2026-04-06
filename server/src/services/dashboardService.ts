import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dashboardService = {
    /**
     * Get Comprehensive Stats for Workbench Dashboard
     */
    async getStats(companyId: string) {
        // 1. Top Products
        const invoices = await prisma.invoice.findMany({
            where: { companyId, status: { in: ['POSTED', 'PAID'] }, deletedAt: null },
            include: { items: { include: { product: true } } }
        });

        const productSales: Record<string, { name: string, sales: number, amount: number }> = {};
        for (const inv of invoices) {
            for (const item of inv.items) {
                if (item.productId) {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = { name: item.product?.name || 'Unknown', sales: 0, amount: 0 };
                    }
                    productSales[item.productId].sales += Number(item.quantity);
                    productSales[item.productId].amount += Number(item.total);
                }
            }
        }
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        // 2. Low Stock Alerts
        const allProducts = await prisma.product.findMany({
            where: {
                companyId,
                trackInventory: true
            }
        });

        const lowStockItems = allProducts
            .filter((p: any) => Number(p.currentStock || 0) <= Number(p.minStock || 0))
            .slice(0, 5);

        const lowStock = lowStockItems.map((p: any) => ({
            name: p.name,
            current: Number(p.currentStock || 0),
            unit: p.unit || 'units',
            minimum: Number(p.minStock || 0)
        }));

        // 3. Pending Tasks
        const pendingApprovalsCount = await prisma.approvalRequest.count({
            where: { companyId, status: 'PENDING' }
        });

        const overdueInvoicesCount = await prisma.invoice.count({
            where: {
                companyId,
                status: { in: ['POSTED', 'PARTIALLY_PAID'] },
                dueDate: { lt: new Date() },
                deletedAt: null
            }
        });

        const pendingTasks = [];
        if (pendingApprovalsCount > 0) pendingTasks.push({ task: 'Pending Approvals', count: pendingApprovalsCount });
        if (overdueInvoicesCount > 0) pendingTasks.push({ task: 'Overdue Invoices', count: overdueInvoicesCount });
        if (lowStock.length > 0) pendingTasks.push({ task: 'Low Stock Alerts', count: lowStockItems.length });

        // 4. App Recommendations (Growth Engine logic)
        const appRecommendations = [];

        // Sum total overdue amount to show a realistic loss
        const overdueResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                status: { in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] },
                dueDate: { lt: new Date() },
                balanceAmount: { gt: 0 },
                deletedAt: null
            },
            _sum: { balanceAmount: true }
        });

        const overdueAmount = Number(overdueResult._sum.balanceAmount || 0);

        if (overdueAmount > 0) {
            appRecommendations.push({
                id: 'payment-intelligence',
                title: 'Payment Intelligence',
                message: `You have ₹${overdueAmount.toLocaleString('en-IN')} in delayed payments. Install Payment Intelligence.`,
                icon: 'payments',
                type: 'revenue-recovery'
            });
        }

        if (lowStock.length > 0) {
            appRecommendations.push({
                id: 'advanced-inventory',
                title: 'Advanced Inventory',
                message: `Low stock detected for ${lowStock.length} items. Keep your supply chain flowing.`,
                icon: 'inventory_2',
                type: 'operations'
            });
        }

        // If they have many invoices, recommend e-invoicing
        const totalInvoices = await prisma.invoice.count({ where: { companyId, deletedAt: null } });
        if (totalInvoices > 10) {
            appRecommendations.push({
                id: 'e-invoicing',
                title: 'E-Invoicing Compliance',
                message: `High invoice volume detected. Ensure compliance with one-click E-Invoicing.`,
                icon: 'receipt',
                type: 'compliance'
            });
        }

        // Default recommendation if none apply
        if (appRecommendations.length === 0) {
            appRecommendations.push({
                id: 'retail-starter',
                title: 'Retail Starter Pack',
                message: 'Essential trio for Indian retail shops. Includes GST, Inventory, and basic CRM.',
                icon: 'storefront',
                type: 'bundle'
            });
        }

        // 5. Business Health Score Calculation
        let healthScore = 100;

        // Overdue Penalty
        const totalOutstandingResult = await prisma.invoice.aggregate({
            where: { companyId, status: { in: ['POSTED', 'PARTIALLY_PAID'] }, deletedAt: null },
            _sum: { balanceAmount: true }
        });
        const totalOutstanding = Number(totalOutstandingResult._sum.balanceAmount || 0);

        if (totalOutstanding > 0) {
            const overduePercentage = overdueAmount / totalOutstanding;
            if (overduePercentage > 0.5) healthScore -= 30;
            else if (overduePercentage > 0.3) healthScore -= 20;
            else if (overduePercentage > 0.1) healthScore -= 10;
        }

        // Low Stock Penalty
        if (lowStock.length > 5) healthScore -= 20;
        else if (lowStock.length > 0) healthScore -= 10;

        // Pending Tasks Penalty
        if (pendingApprovalsCount > 10) healthScore -= 20;
        else if (pendingApprovalsCount > 0) healthScore -= 5;

        // Ensure within bounds
        healthScore = Math.max(0, Math.min(100, healthScore));

        // 6. KPIs sub-object (expected by BusinessOverview & KPICards)
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), now.getMonth() >= 3 ? 3 : -9, 1);

        // Sales (Revenue YTD)
        const salesResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: startOfYear },
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] },
                deletedAt: null,
            },
            _sum: { totalAmount: true },
        });
        const totalSales = Number(salesResult._sum.totalAmount || 0);

        // Purchases YTD
        let totalPurchases = 0;
        try {
            const purchaseResult = await prisma.purchaseOrder.aggregate({
                where: {
                    companyId,
                    orderDate: { gte: startOfYear },
                    status: { in: ['APPROVED', 'RECEIVED', 'COMPLETED'] },
                },
                _sum: { totalAmount: true },
            });
            totalPurchases = Number(purchaseResult._sum.totalAmount || 0);
        } catch { /* purchaseOrder model may not exist yet */ }

        // Receivables (total outstanding invoice balances)
        const receivables = totalOutstanding;

        // Payables (total outstanding purchase bills)
        let totalPayables = 0;
        try {
            const payablesResult = await prisma.purchaseBill.aggregate({
                where: {
                    companyId,
                    status: { in: ['APPROVED', 'PARTIALLY_PAID'] },
                },
                _sum: { balanceAmount: true },
            });
            totalPayables = Number(payablesResult._sum.balanceAmount || 0);
        } catch { /* purchaseBill model may not exist yet */ }

        // Cash & Bank balances from ledger postings
        let cashBalance = 0;
        let bankBalance = 0;
        try {
            const cashGroups = await prisma.ledgerGroup.findMany({
                where: { companyId, code: 'CASH_IN_HAND' },
                include: { ledgers: true },
            });
            const cashLedgerIds = cashGroups.flatMap(g => g.ledgers.map(l => l.id));
            if (cashLedgerIds.length > 0) {
                const cashPostings = await prisma.ledgerPosting.groupBy({
                    by: ['type'],
                    where: { ledgerId: { in: cashLedgerIds } },
                    _sum: { amount: true },
                });
                const cashDebit = Number(cashPostings.find(p => p.type === 'DEBIT')?._sum.amount || 0);
                const cashCredit = Number(cashPostings.find(p => p.type === 'CREDIT')?._sum.amount || 0);
                cashBalance = cashDebit - cashCredit;
            }

            const bankGroups = await prisma.ledgerGroup.findMany({
                where: { companyId, code: 'BANK_ACCOUNTS' },
                include: { ledgers: true },
            });
            const bankLedgerIds = bankGroups.flatMap(g => g.ledgers.map(l => l.id));
            if (bankLedgerIds.length > 0) {
                const bankPostings = await prisma.ledgerPosting.groupBy({
                    by: ['type'],
                    where: { ledgerId: { in: bankLedgerIds } },
                    _sum: { amount: true },
                });
                const bankDebit = Number(bankPostings.find(p => p.type === 'DEBIT')?._sum.amount || 0);
                const bankCredit = Number(bankPostings.find(p => p.type === 'CREDIT')?._sum.amount || 0);
                bankBalance = bankDebit - bankCredit;
            }
        } catch { /* ledger groups may not exist yet */ }

        // 7. Sales Chart (monthly revenue for last 6 months)
        const salesChart = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const monthLabel = d.toLocaleDateString('en-IN', { month: 'short' });
            const agg = await prisma.invoice.aggregate({
                where: {
                    companyId,
                    invoiceDate: { gte: d, lte: end },
                    status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] },
                    deletedAt: null,
                },
                _sum: { totalAmount: true },
            });
            salesChart.push({ date: monthLabel, sales: Number(agg._sum.totalAmount || 0) });
        }

        return {
            topProducts,
            lowStock,
            pendingTasks,
            appRecommendations,
            businessHealthScore: healthScore,
            kpis: {
                sales: totalSales,
                purchases: totalPurchases,
                receivables,
                payables: totalPayables,
                cash: cashBalance,
                bank: bankBalance,
            },
            salesChart,
        };
    },

    /**
     * Get Cash Flow Data for the last 6 months
     * Aggregates balances of Cash and Bank accounts
     */
    async getCashFlow(companyId: string) {
        // 1. Find Cash and Bank Ledger Groups
        const liquidAssetGroups = await prisma.ledgerGroup.findMany({
            where: {
                companyId,
                code: { in: ['CASH_IN_HAND', 'BANK_ACCOUNTS'] } // Ensure these codes match your seed data
            },
            include: { ledgers: true }
        });

        const ledgerIds = liquidAssetGroups.flatMap(g => g.ledgers.map(l => l.id));

        if (ledgerIds.length === 0) {
            return [];
        }

        // 2. Get monthly balances (Simplified for now: Just current balance)
        // In a real system, you'd calculate historical balances. 
        // For this MVP, we'll return a mock trend based on current balance + random variance to demonstrate the UI

        // Get actual current balance
        const postings = await prisma.ledgerPosting.groupBy({
            by: ['type'],
            where: {
                ledgerId: { in: ledgerIds }
            },
            _sum: { amount: true }
        });

        const debit = Number(postings.find(p => p.type === 'DEBIT')?._sum.amount || 0);
        const credit = Number(postings.find(p => p.type === 'CREDIT')?._sum.amount || 0);
        // Assets: Debit is positive
        const currentTotal = debit - credit;

        // Generate 6 months of data ending with current total
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });

            // Mock historical data: fluctuate by 10-20% around current total
            // The last month (i=0) should be the actual current total
            let value = currentTotal;
            if (i > 0) {
                const variance = (Math.random() * 0.4) - 0.2; // -20% to +20%
                value = currentTotal * (1 - (i * 0.05)) * (1 + variance);
            }

            months.push({
                name: monthName,
                value: Math.round(value)
            });
        }

        return months;
    },

    /**
     * Get Ticker Tape KPIs
     */
    async getTickerData(companyId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Today's Sales
        const sales = await prisma.voucher.findMany({
            where: {
                companyId,
                type: 'SALES',
                date: { gte: today },
                status: 'POSTED'
            },
            include: { postings: true }
        });

        // Sum credit amounts in SALES vouchers (usually the total invoice value)
        // A better way might be to look at the specific 'Sales' ledger posting, but total voucher value is a good proxy if structure is consistent
        // Actually, voucher structure is balanced. We want the Receivable amount (Debit) or Sales Income (Credit).
        // Let's sum the totals.
        let todaySales = 0;
        // Simplification: In a sales voucher, the total credit to Sales Account is the revenue.
        // We'll just count the number of vouchers for now to be fast, or sum the first posting amount?
        // Let's sum total credits in these vouchers.
        for (const voucher of sales) {
            const credits = voucher.postings
                .filter(p => p.type === 'CREDIT')
                .reduce((sum, p) => sum + Number(p.amount), 0);
            todaySales += credits;
        }


        // 2. Pending Approvals
        const pendingApprovals = await prisma.approvalRequest.count({
            where: {
                companyId,
                status: 'PENDING'
            }
        });

        // 3. Low Stock Items
        const lowStockItems = await prisma.product.count({
            where: {
                companyId,
                trackInventory: true,
                currentStock: {
                    lte: prisma.product.fields.minStock
                }
            }
        });

        // 4. Bank Balance (Current)
        // Re-use logic from getCashFlow but simpler
        const liquidAssetGroups = await prisma.ledgerGroup.findMany({
            where: {
                companyId,
                code: { in: ['BANK_ACCOUNTS'] }
            },
            include: { ledgers: true }
        });
        const bankLedgerIds = liquidAssetGroups.flatMap(g => g.ledgers.map(l => l.id));

        let bankBalance = 0;
        if (bankLedgerIds.length > 0) {
            const postings = await prisma.ledgerPosting.groupBy({
                by: ['type'],
                where: { ledgerId: { in: bankLedgerIds } },
                _sum: { amount: true }
            });
            const debit = Number(postings.find(p => p.type === 'DEBIT')?._sum.amount || 0);
            const credit = Number(postings.find(p => p.type === 'CREDIT')?._sum.amount || 0);
            bankBalance = debit - credit;
        }

        return [
            { label: 'Today\'s Sales', value: todaySales, type: 'currency', trend: 'up' }, // Mock trend
            { label: 'Bank Balance', value: bankBalance, type: 'currency', trend: 'neutral' },
            { label: 'Pending Approvals', value: pendingApprovals, type: 'number', status: pendingApprovals > 0 ? 'warning' : 'good' },
            { label: 'Low Stock Items', value: lowStockItems, type: 'number', status: lowStockItems > 0 ? 'critical' : 'good' },
        ];
    },
    /**
     * Get comprehensive dashboard KPIs
     * Revenue YTD, Outstanding, Overdue, GST Liability, Invoice counts
     */
    async getKPIs(companyId: string) {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 3 >= now.getMonth() ? -9 : 3, 1); // Indian FY starts April
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Active invoice statuses (excluding DRAFT and CANCELLED)
        const activeInvoiceStatuses = ['SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'PENDING_APPROVAL'];

        // Revenue YTD (sum of totalAmount for non-draft invoices)
        const revenueResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: startOfYear },
                status: { in: activeInvoiceStatuses },
                deletedAt: null,
            },
            _sum: { totalAmount: true },
            _count: { id: true },
        });

        // Current month sales
        const currentMonthSales = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: startOfMonth },
                status: { in: activeInvoiceStatuses },
                deletedAt: null,
            },
            _sum: { totalAmount: true },
        });

        // Last month sales (for MoM change)
        const lastMonthSales = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: startOfLastMonth, lt: startOfMonth },
                status: { in: activeInvoiceStatuses },
                deletedAt: null,
            },
            _sum: { totalAmount: true },
        });

        // Current month purchases
        const currentMonthPurchases = await prisma.purchaseOrder.aggregate({
            where: {
                companyId,
                orderDate: { gte: startOfMonth },
                status: { notIn: ['CANCELLED'] },
            },
            _sum: { totalAmount: true },
        });

        // Last month purchases (for MoM change)
        const lastMonthPurchases = await prisma.purchaseOrder.aggregate({
            where: {
                companyId,
                orderDate: { gte: startOfLastMonth, lt: startOfMonth },
                status: { notIn: ['CANCELLED'] },
            },
            _sum: { totalAmount: true },
        });

        // Outstanding receivables (unpaid invoice balances)
        const outstandingResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
                balanceAmount: { gt: 0 },
                deletedAt: null,
            },
            _sum: { balanceAmount: true },
            _count: { id: true },
        });

        // Outstanding payables (unpaid purchase order balances)
        const payablesResult = await prisma.purchaseOrder.aggregate({
            where: {
                companyId,
                status: { notIn: ['DRAFT', 'CANCELLED', 'REJECTED'] },
            },
            _sum: { totalAmount: true },
        });

        // Overdue (outstanding where dueDate < today)
        const overdueResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                status: { in: ['SENT', 'PARTIAL', 'OVERDUE'] },
                dueDate: { lt: now },
                balanceAmount: { gt: 0 },
                deletedAt: null,
            },
            _sum: { balanceAmount: true },
            _count: { id: true },
        });

        // GST Liability (sum of CGST + SGST + IGST on active invoices YTD)
        const gstResult = await prisma.invoice.aggregate({
            where: {
                companyId,
                invoiceDate: { gte: startOfYear },
                status: { in: activeInvoiceStatuses },
                deletedAt: null,
            },
            _sum: { cgst: true, sgst: true, igst: true, totalTax: true },
        });

        // Invoices this month
        const monthlyInvoices = await prisma.invoice.count({
            where: {
                companyId,
                invoiceDate: { gte: startOfMonth },
                deletedAt: null,
            },
        });

        // Total payments received YTD
        let paymentsReceivedYTD = 0;
        try {
            const paymentsResult = await prisma.receipt.aggregate({
                where: {
                    companyId,
                    date: { gte: startOfYear },
                    status: 'COMPLETED',
                },
                _sum: { amount: true },
            });
            paymentsReceivedYTD = Number(paymentsResult._sum.amount || 0);
        } catch {
            // receipt model may not exist in all deployments
        }

        // Calculate month-over-month changes
        const currSales = Number(currentMonthSales._sum.totalAmount || 0);
        const prevSales = Number(lastMonthSales._sum.totalAmount || 0);
        const salesChange = prevSales > 0 ? Math.round(((currSales - prevSales) / prevSales) * 100) : 0;

        const currPurchases = Number(currentMonthPurchases._sum.totalAmount || 0);
        const prevPurchases = Number(lastMonthPurchases._sum.totalAmount || 0);
        const purchasesChange = prevPurchases > 0 ? Math.round(((currPurchases - prevPurchases) / prevPurchases) * 100) : 0;

        return {
            // Fields expected by KPICards component
            sales: currSales,
            salesChange,
            purchases: currPurchases,
            purchasesChange,
            receivables: Number(outstandingResult._sum.balanceAmount || 0),
            payables: Number(payablesResult._sum.totalAmount || 0),
            cash: 0,
            bank: 0,
            // Legacy / detailed fields
            revenueYTD: Number(revenueResult._sum.totalAmount || 0),
            totalInvoicesYTD: revenueResult._count.id,
            outstandingAmount: Number(outstandingResult._sum.balanceAmount || 0),
            outstandingCount: outstandingResult._count.id,
            overdueAmount: Number(overdueResult._sum.balanceAmount || 0),
            overdueCount: overdueResult._count.id,
            gstLiability: {
                cgst: Number(gstResult._sum.cgst || 0),
                sgst: Number(gstResult._sum.sgst || 0),
                igst: Number(gstResult._sum.igst || 0),
                total: Number(gstResult._sum.totalTax || 0),
            },
            invoicesThisMonth: monthlyInvoices,
            paymentsReceivedYTD,
        };
    },

    /**
     * Get top customers by revenue
     */
    async getTopCustomers(companyId: string, limit: number = 10) {
        const startOfYear = new Date();
        startOfYear.setMonth(startOfYear.getMonth() >= 3 ? 3 : -9);
        startOfYear.setDate(1);
        startOfYear.setHours(0, 0, 0, 0);

        const invoices = await prisma.invoice.groupBy({
            by: ['customerId'],
            where: {
                companyId,
                invoiceDate: { gte: startOfYear },
                status: { in: ['POSTED', 'PAID', 'PARTIALLY_PAID'] },
                deletedAt: null,
            },
            _sum: { totalAmount: true, balanceAmount: true },
            _count: { id: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: limit,
        });

        // Fetch customer details
        const customerIds = invoices.map(i => i.customerId);
        const customers = await prisma.party.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, phone: true, email: true },
        });

        const customerMap = new Map(customers.map(c => [c.id, c]));

        return invoices.map(inv => ({
            customer: customerMap.get(inv.customerId) || { id: inv.customerId, name: 'Unknown' },
            totalRevenue: Number(inv._sum.totalAmount || 0),
            outstandingAmount: Number(inv._sum.balanceAmount || 0),
            invoiceCount: inv._count.id,
        }));
    },

    /**
     * Get payment aging buckets (0-30, 31-60, 61-90, 90+ days)
     */
    async getPaymentAging(companyId: string) {
        const now = new Date();
        const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
        const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
        const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

        const baseWhere = {
            companyId,
            status: { in: ['POSTED', 'PARTIALLY_PAID', 'OVERDUE'] },
            balanceAmount: { gt: 0 },
            deletedAt: null,
        };

        const [current, bucket30, bucket60, bucket90] = await Promise.all([
            // 0-30 days: dueDate >= 30 days ago
            prisma.invoice.aggregate({
                where: { ...baseWhere, dueDate: { gte: d30 } },
                _sum: { balanceAmount: true },
                _count: { id: true },
            }),
            // 31-60 days
            prisma.invoice.aggregate({
                where: { ...baseWhere, dueDate: { gte: d60, lt: d30 } },
                _sum: { balanceAmount: true },
                _count: { id: true },
            }),
            // 61-90 days
            prisma.invoice.aggregate({
                where: { ...baseWhere, dueDate: { gte: d90, lt: d60 } },
                _sum: { balanceAmount: true },
                _count: { id: true },
            }),
            // 90+ days
            prisma.invoice.aggregate({
                where: { ...baseWhere, dueDate: { lt: d90 } },
                _sum: { balanceAmount: true },
                _count: { id: true },
            }),
        ]);

        return [
            { bucket: '0-30 days', amount: Number(current._sum.balanceAmount || 0), count: current._count.id },
            { bucket: '31-60 days', amount: Number(bucket30._sum.balanceAmount || 0), count: bucket30._count.id },
            { bucket: '61-90 days', amount: Number(bucket60._sum.balanceAmount || 0), count: bucket60._count.id },
            { bucket: '90+ days', amount: Number(bucket90._sum.balanceAmount || 0), count: bucket90._count.id },
        ];
    },

    /**
     * Revenue trend — monthly revenue for the last 6 months
     */
    async getRevenueTrend(companyId: string) {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            months.push({ start: d, end, label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) });
        }

        const results = await Promise.all(
            months.map(async (m) => {
                const agg = await prisma.invoice.aggregate({
                    where: {
                        companyId,
                        invoiceDate: { gte: m.start, lte: m.end },
                        deletedAt: null,
                    },
                    _sum: { totalAmount: true },
                    _count: { id: true },
                });
                return {
                    month: m.label,
                    revenue: Number(agg._sum?.totalAmount || 0),
                    invoices: agg._count?.id ?? 0,
                };
            })
        );

        return results;
    },

    /**
     * GST breakdown — CGST / SGST / IGST split
     */
    async getGSTBreakdown(companyId: string) {
        const fiscalStart = new Date(new Date().getFullYear(), 3, 1); // April 1st
        if (new Date().getMonth() < 3) fiscalStart.setFullYear(fiscalStart.getFullYear() - 1);

        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                invoiceDate: { gte: fiscalStart },
                deletedAt: null,
            },
            select: {
                cgst: true,
                sgst: true,
                igst: true,
            },
        });

        const totals = invoices.reduce(
            (acc, inv) => ({
                cgst: acc.cgst + Number(inv.cgst || 0),
                sgst: acc.sgst + Number(inv.sgst || 0),
                igst: acc.igst + Number(inv.igst || 0),
            }),
            { cgst: 0, sgst: 0, igst: 0 }
        );

        return [
            { name: 'CGST', value: totals.cgst },
            { name: 'SGST', value: totals.sgst },
            { name: 'IGST', value: totals.igst },
        ];
    },
};
