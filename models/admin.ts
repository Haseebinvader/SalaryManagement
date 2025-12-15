import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
    email: string;
    password: string;
}

const AdminSchema: Schema = new Schema<IAdmin>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
