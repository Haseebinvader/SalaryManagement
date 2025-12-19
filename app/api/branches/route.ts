import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Branch } from "@/models/branch";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const branches = await Branch.find({});
        return NextResponse.json(branches);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log("Unauthorized request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        console.log("Request body:", body);

        const { name } = body;
        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
        }

        const branch = new Branch({ name: name.trim() });
        await branch.save();
        console.log("Branch created:", branch);

        return NextResponse.json(branch, { status: 201 });
    } catch (error: any) {
        console.error("POST /branches error:", error.message);
        return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
    }
}
