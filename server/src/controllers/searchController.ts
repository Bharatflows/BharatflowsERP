import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * @desc    Global Search across multiple entities
 * @route   GET /api/v1/search/global
 * @access  Private
 */
export const globalSearch = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        const companyId = req.user?.companyId;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = query.toLowerCase();

        // Perform parallel searches for performance
        const [products, parties, invoices, salesOrders] = await Promise.all([
            // 1. Search Products
            prisma.product.findMany({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: searchTerm } },
                        { code: { contains: searchTerm } },
                        { barcode: { contains: searchTerm } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, code: true, sellingPrice: true }
            }),
            // 2. Search Parties (Customers/Suppliers)
            prisma.party.findMany({
                where: {
                    companyId,
                    OR: [
                        { name: { contains: searchTerm } },
                        { email: { contains: searchTerm } },
                        { phone: { contains: searchTerm } },
                        { gstin: { contains: searchTerm } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, type: true, phone: true }
            }),
            // 3. Search Invoices
            prisma.invoice.findMany({
                where: {
                    companyId,
                    invoiceNumber: { contains: searchTerm }
                },
                take: 5,
                include: { customer: { select: { name: true } } }
            }),
            // 4. Search Sales Orders
            prisma.salesOrder.findMany({
                where: {
                    companyId,
                    orderNumber: { contains: searchTerm }
                },
                take: 5,
                include: { customer: { select: { name: true } } }
            })
        ]);

        // Format results for the frontend
        const results = [
            ...products.map(p => ({ id: p.id, title: p.name, subtitle: `Product • ${p.code || 'No Code'} • ₹${p.sellingPrice}`, type: 'product', url: `/inventory/products/${p.id}` })),
            ...parties.map(p => ({ id: p.id, title: p.name, subtitle: `${p.type} • ${p.phone || 'No Phone'}`, type: 'party', url: `/parties/${p.id}` })),
            ...invoices.map(i => ({ id: i.id, title: i.invoiceNumber, subtitle: `Invoice • ${i.customer.name} • ₹${i.totalAmount}`, type: 'invoice', url: `/sales/invoices/${i.id}` })),
            ...salesOrders.map(s => ({ id: s.id, title: s.orderNumber, subtitle: `Sales Order • ${s.customer.name}`, type: 'sales-order', url: `/sales/orders/${s.id}` }))
        ];

        // Add Quick Actions if query matches command patterns
        if (searchTerm.includes('add') || searchTerm.includes('create') || searchTerm.includes('new')) {
            results.unshift(
                { id: 'action-add-invoice', title: 'Create New Invoice', subtitle: 'Action • Sales Module', type: 'action', url: '/sales/invoices/new' },
                { id: 'action-add-product', title: 'Add New Product', subtitle: 'Action • Inventory Module', type: 'action', url: '/inventory/products/new' },
                { id: 'action-add-customer', title: 'Add New Customer', subtitle: 'Action • Parties Module', type: 'action', url: '/parties/new' }
            );
        }

        res.json({
            success: true,
            data: results
        });
        return;
    } catch (error: any) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
        return;
    }
};
