import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'admin' | 'manager' | 'accountant' | 'user';
    status: 'active' | 'inactive' | 'suspended';
    emailVerified: boolean;
    phoneVerified: boolean;
    companyId: mongoose.Types.ObjectId;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map