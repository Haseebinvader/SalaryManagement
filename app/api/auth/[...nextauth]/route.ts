import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/models/admin";

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await connectDB();
                const admin = await Admin.findOne({ email: credentials?.email });
                if (!admin) return null;
                const valid = await bcrypt.compare(credentials!.password, admin.password);
                if (!valid) return null;
                return { id: admin._id, email: admin.email };
            },
        }),
    ],
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
