import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Branch } from "@/models/branch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { name } = await request.json();
        const branch = await Branch.findByIdAndUpdate(id, { name }, { new: true });
        if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        return NextResponse.json(branch);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const branch = await Branch.findByIdAndDelete(id);
        if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        return NextResponse.json({ message: "Branch deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
    }
}