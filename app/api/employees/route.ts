import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/employee";
import { Branch } from "@/models/branch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const { searchParams } = new URL(request.url);
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');
        const search = searchParams.get('search') || '';
        const searchId = searchParams.get('searchId') || '';
        const branchId = searchParams.get('branchId') || '';
        
        // If pagination params are provided, use pagination; otherwise return all
        const usePagination = pageParam !== null || limitParam !== null;
        const page = pageParam ? parseInt(pageParam) : 1;
        const limit = limitParam ? parseInt(limitParam) : 10;
        const skip = usePagination ? (page - 1) * limit : 0;

        let query: any = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (searchId) {
            query.employeeId = { $regex: searchId, $options: 'i' };
        }
        if (branchId) {
            query.branchId = branchId;
        }

        let employeesQuery = Employee.find(query)
            .populate('branchId')
            .sort({ createdAt: -1 });
        
        if (usePagination) {
            employeesQuery = employeesQuery.skip(skip).limit(limit);
        }

        const employees = await employeesQuery;
        const total = await Employee.countDocuments(query);

        if (usePagination) {
            return NextResponse.json({
                employees,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } else {
            return NextResponse.json({
                employees
            });
        }
    } catch (error) {
        console.error('GET /employees error:', error);
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const data = await request.json();

        // Validation
        if (!data.employeeId || typeof data.employeeId !== 'string' || data.employeeId.trim().length === 0) {
            return NextResponse.json({ error: "Employee ID is required and must be a non-empty string" }, { status: 400 });
        }
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required and must be a non-empty string" }, { status: 400 });
        }
        if (!data.branchId || !/^[0-9a-fA-F]{24}$/.test(data.branchId)) {
            return NextResponse.json({ error: "Valid branchId is required" }, { status: 400 });
        }
        if (!data.salaryMonth || typeof data.salaryMonth !== 'string' || data.salaryMonth.trim().length === 0) {
            return NextResponse.json({ error: "Salary Month is required and must be a non-empty string" }, { status: 400 });
        }

        // Check if branch exists
        const branch = await Branch.findById(data.branchId);
        if (!branch) {
            return NextResponse.json({ error: "Branch not found" }, { status: 400 });
        }

        // Ensure numeric fields are numbers
        const numericFields = ['basicPay', 'productRebate', 'pointsRebate', 'performanceRebate', 'houseRentDeduction', 'foodDeduction', 'loanDeduction', 'loanRemaining'];
        for (const field of numericFields) {
            if (data[field] !== undefined && (typeof data[field] !== 'number' || data[field] < 0)) {
                return NextResponse.json({ error: `${field} must be a non-negative number` }, { status: 400 });
            }
        }

        // Check for duplicate employeeId + salaryMonth combination
        const trimmedEmployeeId = data.employeeId.trim();
        const trimmedSalaryMonth = data.salaryMonth.trim();
        const existingEmployee = await Employee.findOne({
            employeeId: trimmedEmployeeId,
            salaryMonth: trimmedSalaryMonth
        });

        if (existingEmployee) {
            return NextResponse.json({
                error: `An employee with ID "${trimmedEmployeeId}" already exists for the salary month "${trimmedSalaryMonth}". Please use a different month or update the existing record.`
            }, { status: 409 });
        }

        const employee = new Employee({
            ...data,
            employeeId: trimmedEmployeeId,
            name: data.name.trim(),
            salaryMonth: trimmedSalaryMonth
        });

        await employee.save();
        await employee.populate('branchId');

        return NextResponse.json(employee, { status: 201 });
    } catch (error: any) {
        console.error('POST /employees error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}