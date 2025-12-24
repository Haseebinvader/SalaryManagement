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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const branchId = searchParams.get('branchId') || '';
        const skip = (page - 1) * limit;

        let query: any = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (branchId) {
            query.branchId = branchId;
        }

        const employees = await Employee.find(query)
            .populate('branchId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Employee.countDocuments(query);

        return NextResponse.json({
            employees,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
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
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required and must be a non-empty string" }, { status: 400 });
        }
        if (!data.branchId || !/^[0-9a-fA-F]{24}$/.test(data.branchId)) {
            return NextResponse.json({ error: "Valid branchId is required" }, { status: 400 });
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

        const employee = new Employee({
            ...data,
            name: data.name.trim()
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