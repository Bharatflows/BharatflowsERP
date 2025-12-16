import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceType: 'tax_invoice' | 'proforma' | 'export';
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerGSTIN?: string;
  customerAddress: object;
  invoiceDate: Date;
  dueDate?: Date;
  placeOfSupply: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    rate: number;
    discount: number;
    taxableAmount: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalAmount: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  paymentTerms?: string;
  notes?: string;
  termsAndConditions?: string;
  attachments: string[];
  eInvoiceDetails?: {
    irn: string;
    ackNo: string;
    ackDate: Date;
    qrCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true
  }
);

// Index for faster queries
invoiceSchema.index({ companyId: 1, invoiceNumber: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
