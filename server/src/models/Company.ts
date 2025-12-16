import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  legalName?: string;
  gstin: string;
  pan?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contactDetails: {
    phone: string;
    email: string;
    website?: string;
  };
  bankDetails: Array<{
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: string;
    isPrimary: boolean;
  }>;
  logo?: string;
  fiscalYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    legalName: {
      type: String,
      trim: true
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      unique: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GSTIN']
    },
    pan: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN']
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    contactDetails: {
      phone: String,
      email: String,
      website: String
    },
    bankDetails: [
      {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        accountType: String,
        isPrimary: { type: Boolean, default: false }
      }
    ],
    logo: String,
    fiscalYear: {
      type: String,
      default: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ICompany>('Company', companySchema);
