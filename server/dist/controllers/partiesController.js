"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParty = exports.updateParty = exports.getParty = exports.getParties = exports.createParty = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createParty = async (req, res) => {
    try {
        const { name, type, gstin, pan, email, phone, address, city, state, pincode, openingBalance } = req.body;
        const companyId = req.user.companyId;
        // Construct address object
        const addressObj = {
            address,
            city,
            state,
            pincode
        };
        const party = await prisma_1.default.party.create({
            data: {
                name,
                type: type ? type.toUpperCase() : 'CUSTOMER',
                gstin,
                pan,
                email,
                phone,
                billingAddress: addressObj,
                shippingAddress: addressObj,
                openingBalance: openingBalance || 0,
                currentBalance: openingBalance || 0,
                companyId
            }
        });
        return res.status(201).json({
            success: true,
            data: party
        });
    }
    catch (error) {
        console.error('Create party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating party'
        });
    }
};
exports.createParty = createParty;
const getParties = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { type } = req.query;
        const where = { companyId, isActive: true };
        if (type) {
            // Convert to uppercase for case-insensitive matching
            where.type = type.toUpperCase();
        }
        const parties = await prisma_1.default.party.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return res.json({
            success: true,
            data: parties
        });
    }
    catch (error) {
        console.error('Get parties error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching parties'
        });
    }
};
exports.getParties = getParties;
const getParty = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const party = await prisma_1.default.party.findFirst({
            where: { id, companyId }
        });
        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        return res.json({
            success: true,
            data: party
        });
    }
    catch (error) {
        console.error('Get party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching party'
        });
    }
};
exports.getParty = getParty;
const updateParty = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { name, type, gstin, pan, email, phone, address, city, state, pincode, openingBalance } = req.body;
        const existingParty = await prisma_1.default.party.findFirst({
            where: { id, companyId }
        });
        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        // Construct address object
        const addressObj = {
            address,
            city,
            state,
            pincode
        };
        const updatedParty = await prisma_1.default.party.update({
            where: { id },
            data: {
                name,
                type: type ? type.toUpperCase() : undefined,
                gstin,
                pan,
                email,
                phone,
                billingAddress: addressObj,
                shippingAddress: addressObj,
                openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined,
            }
        });
        return res.json({
            success: true,
            data: updatedParty
        });
    }
    catch (error) {
        console.error('Update party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error updating party'
        });
    }
};
exports.updateParty = updateParty;
const deleteParty = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const party = await prisma_1.default.party.findFirst({
            where: { id, companyId }
        });
        if (!party) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        // Soft delete
        await prisma_1.default.party.update({
            where: { id },
            data: { isActive: false }
        });
        return res.json({
            success: true,
            message: 'Party deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting party'
        });
    }
};
exports.deleteParty = deleteParty;
//# sourceMappingURL=partiesController.js.map