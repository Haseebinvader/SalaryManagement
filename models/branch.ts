import mongoose, { Schema, Document } from "mongoose";

export interface IBranch extends Document {
  name: string;
}

const BranchSchema: Schema = new Schema<IBranch>({
  name: { type: String, required: true },
});

// Add index for search
BranchSchema.index({ name: 1 });

export const Branch = mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
