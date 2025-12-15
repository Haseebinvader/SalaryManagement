import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
}

const BranchSchema: Schema = new Schema<IBranch>({
  name: { type: String, required: true },
});

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
