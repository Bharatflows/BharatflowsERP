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
exports.applyIndustryDefaults = exports.checkIntegrity = exports.getNextPreview = exports.previewSequence = exports.updateSequence = exports.getSequence = exports.getSequences = void 0;
const sequenceService = __importStar(require("../services/sequenceService"));
const auditService_1 = require("../services/auditService");
const logger_1 = __importDefault(require("../config/logger"));
// @desc    Get all sequences for company
// @route   GET /api/v1/settings/sequences
// @access  Private
const getSequences = async (req, res) => {
    try {
        const sequences = await sequenceService.getSequences(req.user.companyId);
        return res.json({
            success: true,
            data: sequences,
        });
    }
    catch (error) {
        logger_1.default.error('Get sequences error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sequences',
            error: error.message,
        });
    }
};
exports.getSequences = getSequences;
// @desc    Get sequence for a document type
// @route   GET /api/v1/settings/sequences/:documentType
// @access  Private
const getSequence = async (req, res) => {
    try {
        const { documentType } = req.params;
        const sequence = await sequenceService.getSequence(req.user.companyId, documentType.toUpperCase());
        return res.json({
            success: true,
            data: sequence,
        });
    }
    catch (error) {
        logger_1.default.error('Get sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sequence',
            error: error.message,
        });
    }
};
exports.getSequence = getSequence;
// @desc    Update sequence configuration
// @route   PUT /api/v1/settings/sequences/:documentType
// @access  Private
const updateSequence = async (req, res) => {
    try {
        const { documentType } = req.params;
        const { prefix, nextNumber, format } = req.body;
        // Validate input
        if (prefix && (typeof prefix !== 'string' || prefix.length > 10)) {
            return res.status(400).json({
                success: false,
                message: 'Prefix must be a string of max 10 characters',
            });
        }
        if (nextNumber !== undefined && (typeof nextNumber !== 'number' || nextNumber < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Next number must be a positive integer',
            });
        }
        // RISK MITIGATION: Check for sequence gaps
        const warnings = [];
        if (nextNumber !== undefined) {
            const currentSequence = await sequenceService.getSequence(req.user.companyId, documentType.toUpperCase());
            if (nextNumber < currentSequence.nextNumber) {
                const gap = currentSequence.nextNumber - nextNumber;
                warnings.push(`Warning: Sequence number decreased from ${currentSequence.nextNumber} to ${nextNumber}. ` +
                    `This creates a gap of ${gap} numbers and may cause duplicate document numbers.`);
                logger_1.default.warn('Sequence backward change detected', {
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    documentType,
                    oldValue: currentSequence.nextNumber,
                    newValue: nextNumber,
                    gap
                });
            }
        }
        const sequence = await sequenceService.updateSequence(req.user.companyId, documentType.toUpperCase(), { prefix, nextNumber, format });
        return res.json({
            success: true,
            message: 'Sequence updated successfully',
            data: sequence,
            warnings: warnings.length > 0 ? warnings : undefined
        });
    }
    catch (error) {
        logger_1.default.error('Update sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update sequence',
            error: error.message,
        });
    }
};
exports.updateSequence = updateSequence;
// @desc    Preview next document number
// @route   POST /api/v1/settings/sequences/preview
// @access  Private
const previewSequence = async (req, res) => {
    try {
        const { prefix, nextNumber, format } = req.body;
        if (!prefix || !nextNumber || !format) {
            return res.status(400).json({
                success: false,
                message: 'Prefix, nextNumber, and format are required',
            });
        }
        const preview = sequenceService.previewNextNumber(prefix, nextNumber, format);
        return res.json({
            success: true,
            data: { preview },
        });
    }
    catch (error) {
        logger_1.default.error('Preview sequence error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to preview sequence',
            error: error.message,
        });
    }
};
exports.previewSequence = previewSequence;
// @desc    Get next document number preview (without incrementing)
// @route   GET /api/v1/settings/sequences/:documentType/next
// @access  Private
const getNextPreview = async (req, res) => {
    try {
        const { documentType } = req.params;
        const sequence = await sequenceService.getSequence(req.user.companyId, documentType.toUpperCase());
        // Generate the preview number using current sequence values
        const nextNumber = sequenceService.previewNextNumber(sequence.prefix, sequence.nextNumber, sequence.format || '{PREFIX}-{YEAR}-{SEQ:3}');
        return res.json({
            success: true,
            data: {
                nextNumber,
                sequence
            },
        });
    }
    catch (error) {
        logger_1.default.error('Get next preview error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get next number preview',
            error: error.message,
        });
    }
};
exports.getNextPreview = getNextPreview;
// @desc    Check data integrity (audit logs)
// @route   POST /api/v1/settings/integrity-check
// @access  Private
const checkIntegrity = async (req, res) => {
    try {
        const result = await auditService_1.AuditService.verifyChain(req.user.companyId);
        if (result === true) {
            return res.json({
                success: true,
                message: 'Data integrity verified successfully',
            });
        }
        else {
            return res.status(409).json({
                success: false,
                message: 'Data integrity check failed',
                tamperedLogId: result,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Check integrity error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check data integrity',
            error: error.message,
        });
    }
};
exports.checkIntegrity = checkIntegrity;
// Industry defaults configuration
const INDUSTRY_DEFAULTS = {
    MANUFACTURING: {
        modules: { inventory: true, pos: false, production: true, accounting: true, gst: true, crm: false, hr: true, banking: true },
        features: { barcode: true, bom: true, wastage: true, serialTracking: false, batchTracking: true, multiWarehouse: true, ecommerce: false }
    },
    TRADING: {
        modules: { inventory: true, pos: true, production: false, accounting: true, gst: true, crm: true, hr: false, banking: true },
        features: { barcode: true, bom: false, wastage: false, serialTracking: false, batchTracking: false, multiWarehouse: true, ecommerce: true }
    },
    SERVICE: {
        modules: { inventory: false, pos: true, production: false, accounting: true, gst: true, crm: true, hr: true, banking: true },
        features: { barcode: false, bom: false, wastage: false, serialTracking: false, batchTracking: false, multiWarehouse: false, ecommerce: false }
    },
    HYBRID: {
        modules: { inventory: true, pos: true, production: true, accounting: true, gst: true, crm: true, hr: true, banking: true },
        features: { barcode: true, bom: true, wastage: true, serialTracking: true, batchTracking: true, multiWarehouse: true, ecommerce: true }
    }
};
// @desc    Apply industry-specific default settings
// @route   POST /api/v1/settings/apply-industry-defaults
// @access  Private (Admin/Owner only)
const applyIndustryDefaults = async (req, res) => {
    try {
        const { industry, sector } = req.body;
        // PATH 1: Sector-Specific Blueprint (New MSME OS Flow)
        if (sector) {
            // Lazy load service to avoid circular deps if any
            const { autoConfigService } = await Promise.resolve().then(() => __importStar(require('../services/autoConfigService')));
            try {
                await autoConfigService.applySectorBlueprint(req.user.companyId, sector);
                return res.json({
                    success: true,
                    message: `Sector blueprint for ${sector} applied successfully`,
                    data: { sector }
                });
            }
            catch (err) {
                logger_1.default.error(`Failed to apply sector blueprint ${sector}:`, err);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Invalid sector blueprint'
                });
            }
        }
        // PATH 2: Generic Business Type Defaults (Legacy/Fallback)
        if (!industry || !INDUSTRY_DEFAULTS[industry.toUpperCase()]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid industry/business type. Valid options: MANUFACTURING, TRADING, SERVICE, HYBRID',
            });
        }
        const defaults = INDUSTRY_DEFAULTS[industry.toUpperCase()];
        // Import prisma here to avoid circular dependency
        const prisma = (await Promise.resolve().then(() => __importStar(require('../config/prisma')))).default;
        // Update company with recommended modules and features
        const updatedCompany = await prisma.company.update({
            where: { id: req.user.companyId },
            data: {
                enabledModules: defaults.modules,
                features: defaults.features,
                businessType: industry.toUpperCase()
            }
        });
        // Log the configuration change
        logger_1.default.info('Industry defaults applied', {
            companyId: req.user.companyId,
            userId: req.user.id,
            industry: industry.toUpperCase(),
            modules: defaults.modules,
            features: defaults.features
        });
        return res.json({
            success: true,
            message: `Industry defaults for ${industry} applied successfully`,
            data: {
                enabledModules: updatedCompany.enabledModules,
                features: updatedCompany.features,
                businessType: updatedCompany.businessType
            }
        });
    }
    catch (error) {
        logger_1.default.error('Apply industry defaults error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to apply industry defaults',
            error: error.message,
        });
    }
};
exports.applyIndustryDefaults = applyIndustryDefaults;
//# sourceMappingURL=settingsController.js.map