import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/employee";
import { Branch } from "@/models/branch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const employees = await Employee.find({}).populate('branchId');
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const data = await request.json();
        const employee = new Employee(data);
        await employee.save();
        const populated = await Employee.findById(employee._id).populate('branchId');
        return NextResponse.json(populated, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}