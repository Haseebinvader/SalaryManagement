import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/employee";
import { Branch } from "@/models/branch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const data = await request.json();

        // Validation
        if (data.name !== undefined && (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)) {
            return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
        }
        if (data.branchId !== undefined && !/^[0-9a-fA-F]{24}$/.test(data.branchId)) {
            return NextResponse.json({ error: "Invalid branchId" }, { status: 400 });
        }

        // Check if branch exists if updating branchId
        if (data.branchId) {
            const branch = await Branch.findById(data.branchId);
            if (!branch) {
                return NextResponse.json({ error: "Branch not found" }, { status: 400 });
            }
        }

        // Ensure numeric fields are numbers
        const numericFields = ['basicPay', 'productRebate', 'pointsRebate', 'performanceRebate', 'houseRentDeduction', 'foodDeduction', 'loanDeduction', 'loanRemaining'];
        for (const field of numericFields) {
            if (data[field] !== undefined && (typeof data[field] !== 'number' || data[field] < 0)) {
                return NextResponse.json({ error: `${field} must be a non-negative number` }, { status: 400 });
            }
        }

        const updateData = { ...data };
        if (data.name) updateData.name = data.name.trim();

        const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true }).populate('branchId');
        if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        return NextResponse.json(employee);
    } catch (error: any) {
        console.error('PUT /employees/[id] error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        return NextResponse.json({ message: "Employee deleted" });
    } catch (error) {
        console.error('DELETE /employees/[id] error:', error);
        return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }
}