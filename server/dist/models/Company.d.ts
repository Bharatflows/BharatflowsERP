import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ICompany, {}, {}, {}, mongoose.Document<unknown, {}, ICompany, {}, {}> & ICompany & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Company.d.ts.map