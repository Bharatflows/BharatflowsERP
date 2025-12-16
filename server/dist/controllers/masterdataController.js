"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = exports.deleteUnit = exports.updateUnit = exports.createUnit = exports.getUnits = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ====== UNITS CRUD ======
// @desc    Get all units
// @route   GET /api/v1/masterdata/units
// @access  Private
const getUnits = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const units = await prisma.unit.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            count: units.length,
            data: units
        });
    }
    catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getUnits = getUnits;
// @desc    Create unit
// @route   POST /api/v1/masterdata/units
// @access  Private
const createUnit = async (req, res) => {
    try {
        const { name, symbol } = req.body;
        const companyId = req.user?.companyId;
        if (!name || !symbol) {
            res.status(400).json({
                success: false,
                message: 'Name and symbol are required'
            });
            return;
        }
        const unit = await prisma.unit.create({
            data: {
                companyId: companyId,
                name,
                symbol
            }
        });
        res.status(201).json({
            success: true,
            data: unit
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'Unit with this symbol already exists'
            });
            return;
        }
        console.error('Error creating unit:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createUnit = createUnit;
// @desc    Update unit
// @route   PUT /api/v1/masterdata/units/:id
// @access  Private
const updateUnit = async (req, res) => {
    try {
        const { name, symbol, isActive } = req.body;
        const unitId = req.params.id;
        const companyId = req.user?.companyId;
        const existingUnit = await prisma.unit.findFirst({
            where: { id: unitId, companyId }
        });
        if (!existingUnit) {
            res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
            return;
        }
        const unit = await prisma.unit.update({
            where: { id: unitId },
            data: { name, symbol, isActive }
        });
        res.json({
            success: true,
            data: unit
        });
    }
    catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateUnit = updateUnit;
// @desc    Delete unit
// @route   DELETE /api/v1/masterdata/units/:id
// @access  Private
const deleteUnit = async (req, res) => {
    try {
        const unitId = req.params.id;
        const companyId = req.user?.companyId;
        const existingUnit = await prisma.unit.findFirst({
            where: { id: unitId, companyId }
        });
        if (!existingUnit) {
            res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
            return;
        }
        await prisma.unit.delete({
            where: { id: unitId }
        });
        res.json({
            success: true,
            message: 'Unit deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteUnit = deleteUnit;
// ====== CATEGORIES CRUD ======
// @desc    Get all categories
// @route   GET /api/v1/masterdata/categories
// @access  Private
const getCategories = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        const categories = await prisma.category.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.getCategories = getCategories;
// @desc    Create category
// @route   POST /api/v1/masterdata/categories
// @access  Private
const createCategory = async (req, res) => {
    try {
        const { name, description, parentId } = req.body;
        const companyId = req.user?.companyId;
        if (!name) {
            res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
            return;
        }
        const category = await prisma.category.create({
            data: {
                companyId: companyId,
                name,
                description,
                parentId
            }
        });
        res.status(201).json({
            success: true,
            data: category
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
            return;
        }
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.createCategory = createCategory;
// @desc    Update category
// @route   PUT /api/v1/masterdata/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
    try {
        const { name, description, parentId, isActive } = req.body;
        const categoryId = req.params.id;
        const companyId = req.user?.companyId;
        const existingCategory = await prisma.category.findFirst({
            where: { id: categoryId, companyId }
        });
        if (!existingCategory) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name, description, parentId, isActive }
        });
        res.json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.updateCategory = updateCategory;
// @desc    Delete category
// @route   DELETE /api/v1/masterdata/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const companyId = req.user?.companyId;
        const existingCategory = await prisma.category.findFirst({
            where: { id: categoryId, companyId }
        });
        if (!existingCategory) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }
        await prisma.category.delete({
            where: { id: categoryId }
        });
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=masterdataController.js.map