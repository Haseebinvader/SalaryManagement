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
        if (data.employeeId !== undefined && (!data.employeeId || typeof data.employeeId !== 'string' || data.employeeId.trim().length === 0)) {
            return NextResponse.json({ error: "Employee ID must be a non-empty string" }, { status: 400 });
        }
        if (data.name !== undefined && (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)) {
            return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
        }
        if (data.branchId !== undefined && !/^[0-9a-fA-F]{24}$/.test(data.branchId)) {
            return NextResponse.json({ error: "Invalid branchId" }, { status: 400 });
        }
        if (data.salaryMonth !== undefined && (!data.salaryMonth || typeof data.salaryMonth !== 'string' || data.salaryMonth.trim().length === 0)) {
            return NextResponse.json({ error: "Salary Month must be a non-empty string" }, { status: 400 });
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

        // Get current employee to check existing values
        const currentEmployee = await Employee.findById(id);
        if (!currentEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Determine the employeeId and salaryMonth to check for duplicates
        const employeeIdToCheck = data.employeeId !== undefined ? data.employeeId.trim() : currentEmployee.employeeId;
        const salaryMonthToCheck = data.salaryMonth !== undefined ? data.salaryMonth.trim() : currentEmployee.salaryMonth;

        // Check for duplicate employeeId + salaryMonth combination (excluding current employee)
        if (data.employeeId !== undefined || data.salaryMonth !== undefined) {
            const existingEmployee = await Employee.findOne({
                employeeId: employeeIdToCheck,
                salaryMonth: salaryMonthToCheck,
                _id: { $ne: id } // Exclude current employee
            });

            if (existingEmployee) {
                return NextResponse.json({
                    error: `An employee with ID "${employeeIdToCheck}" already exists for the salary month "${salaryMonthToCheck}". Please use a different month or update the existing record.`
                }, { status: 409 });
            }
        }

        const updateData = { ...data };
        if (data.employeeId) updateData.employeeId = data.employeeId.trim();
        if (data.name) updateData.name = data.name.trim();
        if (data.salaryMonth) updateData.salaryMonth = data.salaryMonth.trim();

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