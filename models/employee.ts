import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
    name: string;
    branchId: mongoose.Types.ObjectId;
    basicPay: number;
    productRebate: number;
    pointsRebate: number;
    performanceRebate: number;
    houseRentDeduction: number;
    foodDeduction: number;
    loanDeduction: number;
    loanRemaining: number;
    createdAt: Date;
    updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema<IEmployee>(
    {
        name: { type: String, required: true },
        branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
        basicPay: { type: Number, default: 0 },
        productRebate: { type: Number, default: 0 },
        pointsRebate: { type: Number, default: 0 },
        performanceRebate: { type: Number, default: 0 },
        houseRentDeduction: { type: Number, default: 0 },
        foodDeduction: { type: Number, default: 0 },
        loanDeduction: { type: Number, default: 0 },
        loanRemaining: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Add index for better query performance
EmployeeSchema.index({ branchId: 1 });
EmployeeSchema.index({ name: 1 }); // For search

export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
