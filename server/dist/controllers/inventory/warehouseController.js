"use strict";
/**
 * Warehouse Controller
 *
 * Handles warehouse CRUD operations.
 * Split from inventoryController.ts for better maintainability.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWarehouse = exports.updateWarehouse = exports.getWarehouses = exports.createWarehouse = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../config/logger"));
// Create Warehouse
const createWarehouse = async (req, res) => {
    try {
        const { name, code, address, city, state, pincode, isDefault } = req.body;
        const companyId = req.user.companyId;
        const warehouse = await prisma_1.default.warehouse.create({
            data: {
                name,
                code,
                address,
                city,
                state,
                pincode,
                isDefault: isDefault || false,
                companyId
            }
        });
        res.status(201).json({
            success: true,
            data: warehouse
        });
    }
    catch (error) {
        logger_1.default.error('Create warehouse error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating warehouse'
        });
    }
};
exports.createWarehouse = createWarehouse;
// Get All Warehouses
const getWarehouses = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const warehouses = await prisma_1.default.warehouse.findMany({
            where: {
                companyId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json({
            success: true,
            data: warehouses
        });
    }
    catch (error) {
        logger_1.default.error('Get warehouses error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching warehouses'
        });
    }
};
exports.getWarehouses = getWarehouses;
// Update Warehouse
const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const warehouse = await prisma_1.default.warehouse.findFirst({
            where: { id, companyId }
        });
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }
        const updatedWarehouse = await prisma_1.default.warehouse.update({
            where: { id },
            data: req.body
        });
        return res.json({
            success: true,
            data: updatedWarehouse
        });
    }
    catch (error) {
        logger_1.default.error('Update warehouse error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating warehouse'
        });
    }
};
exports.updateWarehouse = updateWarehouse;
// Delete Warehouse (soft delete)
const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const warehouse = await prisma_1.default.warehouse.findFirst({
            where: { id, companyId }
        });
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found'
            });
        }
        await prisma_1.default.warehouse.update({
            where: { id },
            data: { isActive: false }
        });
        return res.json({
            success: true,
            message: 'Warehouse deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete warehouse error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting warehouse'
        });
    }
};
exports.deleteWarehouse = deleteWarehouse;
//# sourceMappingURL=warehouseController.js.map