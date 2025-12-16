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
exports.getNextPreview = exports.previewSequence = exports.updateSequence = exports.getSequence = exports.getSequences = void 0;
const sequenceService = __importStar(require("../services/sequenceService"));
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
        const sequence = await sequenceService.updateSequence(req.user.companyId, documentType.toUpperCase(), { prefix, nextNumber, format });
        return res.json({
            success: true,
            message: 'Sequence updated successfully',
            data: sequence,
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
//# sourceMappingURL=settingsController.js.map