import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Employee } from "@/models/employee";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const data = await request.json();
        const employee = await Employee.findByIdAndUpdate(id, data, { new: true }).populate('branchId');
        if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        return NextResponse.json(employee);
    } catch (error) {
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
        return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }
}