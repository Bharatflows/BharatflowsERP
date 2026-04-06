"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBusiness = exports.getTrustScore = exports.deleteParty = exports.updateParty = exports.getParty = exports.getParties = exports.createParty = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const validationService_1 = require("../services/validationService");
const auditService_1 = require("../services/auditService");
const eventBus_1 = __importStar(require("../services/eventBus")); // P0: Domain events
const logger_1 = __importDefault(require("../config/logger"));
// TrustService removed - domains folder deleted
const createParty = async (req, res) => {
    try {
        const { name, type, gstin, pan, email, phone, address, city, state, pincode, openingBalance, msmeType, udyamNumber } = req.body;
        const companyId = req.user.companyId;
        // Validation: GSTIN
        if (gstin && !validationService_1.ValidationUtils.isValidGSTIN(gstin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GSTIN format'
            });
        }
        // Auto-extract PAN if not provided
        let finalPan = pan;
        if (gstin && !pan) {
            finalPan = validationService_1.ValidationUtils.extractPAN(gstin);
        }
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
                pan: finalPan,
                email,
                phone,
                billingAddress: JSON.stringify(addressObj),
                shippingAddress: JSON.stringify(addressObj),
                openingBalance: openingBalance || 0,
                currentBalance: openingBalance || 0,
                companyId,
                msmeType,
                udyamNumber
            }
        });
        // Audit Log
        await auditService_1.AuditService.logChange(companyId, req.user.id, 'PARTY', party.id, 'CREATE', null, party, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'PARTIES');
        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus_1.default.emit({
                companyId,
                eventType: eventBus_1.EventTypes.PARTY_CREATED,
                aggregateType: 'Party',
                aggregateId: party.id,
                payload: {
                    partyId: party.id,
                    name: party.name,
                    type: party.type,
                    gstin: party.gstin,
                    openingBalance: Number(party.openingBalance)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit PARTY_CREATED event:', eventError);
        }
        return res.status(201).json({
            success: true,
            data: party
        });
    }
    catch (error) {
        logger_1.default.error('Create party error:', error);
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
        logger_1.default.error('Get parties error:', error);
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
        logger_1.default.error('Get party error:', error);
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
        const { name, type, gstin, pan, email, phone, address, city, state, pincode, openingBalance, msmeType, udyamNumber } = req.body;
        const existingParty = await prisma_1.default.party.findFirst({
            where: { id, companyId }
        });
        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message: 'Party not found'
            });
        }
        // Validation: GSTIN
        if (gstin && !validationService_1.ValidationUtils.isValidGSTIN(gstin)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GSTIN format'
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
                billingAddress: JSON.stringify(addressObj),
                shippingAddress: JSON.stringify(addressObj),
                openingBalance: openingBalance !== undefined ? Number(openingBalance) : undefined,
                msmeType,
                udyamNumber
            }
        });
        // Audit Log
        await auditService_1.AuditService.logChange(companyId, req.user.id, 'PARTY', id, 'UPDATE', existingParty, updatedParty, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'PARTIES');
        // P0: Emit domain event for cross-domain processing
        try {
            await eventBus_1.default.emit({
                companyId,
                eventType: eventBus_1.EventTypes.PARTY_UPDATED,
                aggregateType: 'Party',
                aggregateId: id,
                payload: {
                    partyId: id,
                    name: updatedParty.name,
                    type: updatedParty.type,
                    gstin: updatedParty.gstin,
                    currentBalance: Number(updatedParty.currentBalance)
                },
                metadata: {
                    userId: req.user.id,
                    source: 'api'
                }
            });
        }
        catch (eventError) {
            logger_1.default.warn('Failed to emit PARTY_UPDATED event:', eventError);
        }
        return res.json({
            success: true,
            data: updatedParty
        });
    }
    catch (error) {
        logger_1.default.error('Update party error:', error);
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
        const deletedParty = await prisma_1.default.party.update({
            where: { id },
            data: { isActive: false }
        });
        // Audit Log
        await auditService_1.AuditService.logChange(companyId, req.user.id, 'PARTY', id, 'DELETE', party, { isActive: false }, req.ip, req.headers['user-agent'] || 'UNKNOWN', 'PARTIES');
        return res.json({
            success: true,
            message: 'Party deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete party error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting party'
        });
    }
};
exports.deleteParty = deleteParty;
/**
 * @desc    Get Party Trust Score (Stub)
 * @route   GET /api/v1/parties/:id/trust-score
 * @access  Private
 */
const getTrustScore = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        // Stub implementation - TrustService was in deleted domains folder
        logger_1.default.warn('[TrustScore] Service is a stub. Full implementation pending.');
        return res.json({
            success: true,
            data: {
                partyId: id,
                score: 0,
                message: 'Trust score service not yet implemented'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get trust score error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error fetching trust score'
        });
    }
};
exports.getTrustScore = getTrustScore;
/**
 * @desc    Verify Business (Stub)
 * @route   POST /api/v1/parties/verify-business
 * @access  Private
 */
const verifyBusiness = async (req, res) => {
    try {
        // Stub implementation
        logger_1.default.warn('[VerifyBusiness] Service is a stub. Full implementation pending.');
        return res.json({
            success: true,
            data: {
                verified: false,
                message: 'Business verification service not yet implemented'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Verify business error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error verifying business'
        });
    }
};
exports.verifyBusiness = verifyBusiness;
//# sourceMappingURL=partiesController.js.map