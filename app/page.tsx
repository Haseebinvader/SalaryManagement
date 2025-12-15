"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;
        if (session) {
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    }, [session, status, router]);

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <CircularProgress />
        </Box>
    );
}
