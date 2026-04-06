import { Request, Response } from 'express';
import prisma from '../config/prisma';
import logger from '../config/logger';

// @desc    Get all business categories
// @route   GET /api/v1/master/categories
// @access  Public
export const getBusinessCategories = async (req: Request, res: Response): Promise<Response> => {
    try {
        const categories = await prisma.businessCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
        logger.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all industries
// @route   GET /api/v1/master/industries
// @access  Public
export const getIndustries = async (req: Request, res: Response): Promise<Response> => {
    try {
        const industries = await prisma.industry.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: industries });
    } catch (error: any) {
        logger.error('Error fetching industries:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all business activities
// @route   GET /api/v1/master/activities
// @access  Public
export const getBusinessActivities = async (req: Request, res: Response): Promise<Response> => {
    try {
        const activities = await prisma.businessActivity.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: activities });
    } catch (error: any) {
        logger.error('Error fetching activities:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Search business products
// @route   GET /api/v1/master/products
// @access  Public
export const searchBusinessProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { query } = req.query;
        const products = await prisma.businessProduct.findMany({
            where: {
                OR: [
                    { name: { contains: query as string } },
                    { name: { startsWith: query as string } }
                ]
            },
            take: 20,
            orderBy: [
                { isCustom: 'asc' }, // Prefer master data
                { name: 'asc' }
            ]
        });
        return res.status(200).json({ success: true, data: products });
    } catch (error: any) {
        logger.error('Error searching products:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all capabilities
// @route   GET /api/v1/master/capabilities
// @access  Public
export const getBusinessCapabilities = async (req: Request, res: Response): Promise<Response> => {
    try {
        const capabilities = await prisma.businessCapability.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: capabilities });
    } catch (error: any) {
        logger.error('Error fetching capabilities:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Seed Master Data (Internal Use)
// @route   POST /api/v1/master/seed
// @access  Public (Should be protected in prod)
export const seedMasterData = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Categories
        const categories = [
            'Manufacturing',
            'Trading / Wholesale',
            'Retail',
            'Service Provider',
            'Job Work / Contract Manufacturing',
            'Distributor',
            'Importer',
            'Exporter'
        ];
        // Ensure no extra categories exist from previous runs if needed, 
        // but for now just upsert the required ones.
        for (const name of categories) {
            await prisma.businessCategory.upsert({ where: { name }, update: {}, create: { name } });
        }

        // Industries
        const industries = [
            'Textiles & Garments',
            'Packaging',
            'Food Processing',
            'Pharma',
            'Plastics',
            'Electrical & Electronics',
            'Automotive Components',
            'Construction Materials',
            'Machinery',
            'FMCG',
            'Chemicals',
            'Metal Fabrication',
            'Agriculture',
            'IT & Software',
            'Furniture & Home Decor',
            'Paper & Printing',
            'Leather & Footwear'
        ];
        for (const name of industries) {
            await prisma.industry.upsert({ where: { name }, update: { isCustom: false, status: 'active' }, create: { name, isCustom: false, status: 'active' } });
        }

        // Activities
        const activities = ['Manufacturer', 'Supplier', 'Wholesaler', 'Job Worker', 'Assembler', 'Processor', 'Exporter'];
        for (const name of activities) {
            await prisma.businessActivity.upsert({ where: { name }, update: {}, create: { name } });
        }

        // Capabilities
        const capabilities = ['In-house Manufacturing', 'Outsourced Manufacturing', 'Design / CAD', 'Printing', 'Packaging', 'Logistics', 'Quality Testing', 'R&D'];
        for (const name of capabilities) {
            await prisma.businessCapability.upsert({ where: { name }, update: {}, create: { name } });
        }

        return res.status(200).json({ success: true, message: 'Master data seeded' });
    } catch (error: any) {
        logger.error('Error seeding data:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create custom industry (user-submitted)
// @route   POST /api/v1/master/industries
// @access  Public
export const createCustomIndustry = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Industry name is required' });
        }

        const trimmedName = name.trim();

        // Check if already exists (case check - SQLite is case-insensitive by default)
        const existing = await prisma.industry.findFirst({
            where: { name: trimmedName }
        });

        if (existing) {
            return res.status(200).json({ success: true, data: existing, message: 'Industry already exists' });
        }

        const industry = await prisma.industry.create({
            data: {
                name: trimmedName,
                isCustom: true,
                status: 'pending'
            }
        });

        return res.status(201).json({ success: true, data: industry });
    } catch (error: any) {
        logger.error('Error creating custom industry:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create custom product (user-submitted)
// @route   POST /api/v1/master/products
// @access  Public
export const createCustomProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }

        const trimmedName = name.trim();
        const normalizedName = trimmedName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');

        // Check if already exists (case check - SQLite is case-insensitive by default)
        const existing = await prisma.businessProduct.findFirst({
            where: { name: trimmedName }
        });

        if (existing) {
            return res.status(200).json({ success: true, data: existing, message: 'Product already exists' });
        }

        const product = await prisma.businessProduct.create({
            data: {
                name: trimmedName,
                isCustom: true,
                normalizedName
            }
        });

        return res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        logger.error('Error creating custom product:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get popular/default products (for suggestions on focus)
// @route   GET /api/v1/master/products/popular
// @access  Public
export const getPopularProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const products = await prisma.businessProduct.findMany({
            where: { isCustom: false },
            take: 15,
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: products });
    } catch (error: any) {
        logger.error('Error fetching popular products:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// @desc    Get all business types
// @route   GET /api/v1/master/business-types
// @access  Public
export const getBusinessTypes = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Values matching schema.prisma BusinessType enum
        const businessTypes = [
            { value: "MANUFACTURING", label: "Manufacturing", desc: "Production & Job Work" },
            { value: "TRADING", label: "Trading", desc: "Wholesale & Retail" },
            { value: "SERVICE", label: "Service Provider", desc: "Consulting & IT" },
            { value: "HYBRID", label: "Hybrid", desc: "Mixed Operations" }
        ];
        return res.status(200).json({ success: true, data: businessTypes });
    } catch (error: any) {
        logger.error('Error fetching business types:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
