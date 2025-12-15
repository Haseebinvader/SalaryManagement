import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = "mongodb://localhost:27017/salarymanagement";
}

async function main() {
    const { connectDB } = await import("../lib/mongodb");
    const { Admin } = await import("../models/admin");
    const bcrypt = (await import("bcryptjs")).default;

    await connectDB();
    const exists = await Admin.findOne({ email: "admin@example.com" });
    if (!exists) {
        const hashed = await bcrypt.hash("admin123", 10);
        await Admin.create({ email: "admin@example.com", password: hashed });
        console.log("Admin created!");
    } else {
        console.log("Admin already exists");
    }
    process.exit(0);
}

main();
