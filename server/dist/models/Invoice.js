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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const invoiceSchema = new mongoose_1.Schema({
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    invoiceType: {
        type: String,
        enum: ['tax_invoice', 'proforma', 'export'],
        default: 'tax_invoice'
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Party',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerGSTIN: String,
    customerAddress: Object,
    invoiceDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: Date,
    placeOfSupply: {
        type: String,
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Product'
            },
            productName: { type: String, required: true },
            hsnCode: String,
            quantity: { type: Number, required: true },
            unit: { type: String, required: true },
            rate: { type: Number, required: true },
            discount: { type: Number, default: 0 },
            taxableAmount: { type: Number, required: true },
            gstRate: { type: Number, default: 0 },
            cgst: { type: Number, default: 0 },
            sgst: { type: Number, default: 0 },
            igst: { type: Number, default: 0 },
            cess: { type: Number, default: 0 },
            totalAmount: { type: Number, required: true }
        }
    ],
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
        default: 'draft'
    },
    paymentTerms: String,
    notes: String,
    termsAndConditions: String,
    attachments: [String],
    eInvoiceDetails: {
        irn: String,
        ackNo: String,
        ackDate: Date,
        qrCode: String
    }
}, {
    timestamps: true
});
// Index for faster queries
invoiceSchema.index({ companyId: 1, invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
exports.default = mongoose_1.default.model('Invoice', invoiceSchema);
//# sourceMappingURL=Invoice.js.map