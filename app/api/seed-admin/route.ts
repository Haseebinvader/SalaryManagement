import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { Admin } from '../../../models/admin';
import bcrypt from 'bcryptjs';

export async function POST() {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@securevision.com' });
        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin
        const admin = new Admin({
            email: 'admin@securevision.com',
            password: hashedPassword,
        });

        await admin.save();

        return NextResponse.json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error('Error seeding admin:', error);
        return NextResponse.json({ error: 'Failed to seed admin' }, { status: 500 });
    }
}