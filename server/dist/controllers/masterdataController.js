"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessTypes = exports.getPopularProducts = exports.createCustomProduct = exports.createCustomIndustry = exports.seedMasterData = exports.getBusinessCapabilities = exports.searchBusinessProducts = exports.getBusinessActivities = exports.getIndustries = exports.getBusinessCategories = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../config/logger"));
// @desc    Get all business categories
// @route   GET /api/v1/master/categories
// @access  Public
const getBusinessCategories = async (req, res) => {
    try {
        const categories = await prisma_1.default.businessCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: categories });
    }
    catch (error) {
        logger_1.default.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getBusinessCategories = getBusinessCategories;
// @desc    Get all industries
// @route   GET /api/v1/master/industries
// @access  Public
const getIndustries = async (req, res) => {
    try {
        const industries = await prisma_1.default.industry.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: industries });
    }
    catch (error) {
        logger_1.default.error('Error fetching industries:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getIndustries = getIndustries;
// @desc    Get all business activities
// @route   GET /api/v1/master/activities
// @access  Public
const getBusinessActivities = async (req, res) => {
    try {
        const activities = await prisma_1.default.businessActivity.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: activities });
    }
    catch (error) {
        logger_1.default.error('Error fetching activities:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getBusinessActivities = getBusinessActivities;
// @desc    Search business products
// @route   GET /api/v1/master/products
// @access  Public
const searchBusinessProducts = async (req, res) => {
    try {
        const { query } = req.query;
        const products = await prisma_1.default.businessProduct.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { name: { startsWith: query } }
                ]
            },
            take: 20,
            orderBy: [
                { isCustom: 'asc' }, // Prefer master data
                { name: 'asc' }
            ]
        });
        return res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        logger_1.default.error('Error searching products:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.searchBusinessProducts = searchBusinessProducts;
// @desc    Get all capabilities
// @route   GET /api/v1/master/capabilities
// @access  Public
const getBusinessCapabilities = async (req, res) => {
    try {
        const capabilities = await prisma_1.default.businessCapability.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: capabilities });
    }
    catch (error) {
        logger_1.default.error('Error fetching capabilities:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getBusinessCapabilities = getBusinessCapabilities;
// @desc    Seed Master Data (Internal Use)
// @route   POST /api/v1/master/seed
// @access  Public (Should be protected in prod)
const seedMasterData = async (req, res) => {
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
            await prisma_1.default.businessCategory.upsert({ where: { name }, update: {}, create: { name } });
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
            await prisma_1.default.industry.upsert({ where: { name }, update: { isCustom: false, status: 'active' }, create: { name, isCustom: false, status: 'active' } });
        }
        // Activities
        const activities = ['Manufacturer', 'Supplier', 'Wholesaler', 'Job Worker', 'Assembler', 'Processor', 'Exporter'];
        for (const name of activities) {
            await prisma_1.default.businessActivity.upsert({ where: { name }, update: {}, create: { name } });
        }
        // Capabilities
        const capabilities = ['In-house Manufacturing', 'Outsourced Manufacturing', 'Design / CAD', 'Printing', 'Packaging', 'Logistics', 'Quality Testing', 'R&D'];
        for (const name of capabilities) {
            await prisma_1.default.businessCapability.upsert({ where: { name }, update: {}, create: { name } });
        }
        return res.status(200).json({ success: true, message: 'Master data seeded' });
    }
    catch (error) {
        logger_1.default.error('Error seeding data:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.seedMasterData = seedMasterData;
// @desc    Create custom industry (user-submitted)
// @route   POST /api/v1/master/industries
// @access  Public
const createCustomIndustry = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Industry name is required' });
        }
        const trimmedName = name.trim();
        // Check if already exists (case check - SQLite is case-insensitive by default)
        const existing = await prisma_1.default.industry.findFirst({
            where: { name: trimmedName }
        });
        if (existing) {
            return res.status(200).json({ success: true, data: existing, message: 'Industry already exists' });
        }
        const industry = await prisma_1.default.industry.create({
            data: {
                name: trimmedName,
                isCustom: true,
                status: 'pending'
            }
        });
        return res.status(201).json({ success: true, data: industry });
    }
    catch (error) {
        logger_1.default.error('Error creating custom industry:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.createCustomIndustry = createCustomIndustry;
// @desc    Create custom product (user-submitted)
// @route   POST /api/v1/master/products
// @access  Public
const createCustomProduct = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }
        const trimmedName = name.trim();
        const normalizedName = trimmedName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        // Check if already exists (case check - SQLite is case-insensitive by default)
        const existing = await prisma_1.default.businessProduct.findFirst({
            where: { name: trimmedName }
        });
        if (existing) {
            return res.status(200).json({ success: true, data: existing, message: 'Product already exists' });
        }
        const product = await prisma_1.default.businessProduct.create({
            data: {
                name: trimmedName,
                isCustom: true,
                normalizedName
            }
        });
        return res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        logger_1.default.error('Error creating custom product:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.createCustomProduct = createCustomProduct;
// @desc    Get popular/default products (for suggestions on focus)
// @route   GET /api/v1/master/products/popular
// @access  Public
const getPopularProducts = async (req, res) => {
    try {
        const products = await prisma_1.default.businessProduct.findMany({
            where: { isCustom: false },
            take: 15,
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ success: true, data: products });
    }
    catch (error) {
        logger_1.default.error('Error fetching popular products:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getPopularProducts = getPopularProducts;
// @desc    Get all business types
// @route   GET /api/v1/master/business-types
// @access  Public
const getBusinessTypes = async (req, res) => {
    try {
        // Values matching schema.prisma BusinessType enum
        const businessTypes = [
            { value: "MANUFACTURING", label: "Manufacturing", desc: "Production & Job Work" },
            { value: "TRADING", label: "Trading", desc: "Wholesale & Retail" },
            { value: "SERVICE", label: "Service Provider", desc: "Consulting & IT" },
            { value: "HYBRID", label: "Hybrid", desc: "Mixed Operations" }
        ];
        return res.status(200).json({ success: true, data: businessTypes });
    }
    catch (error) {
        logger_1.default.error('Error fetching business types:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getBusinessTypes = getBusinessTypes;
//# sourceMappingURL=masterdataController.js.map