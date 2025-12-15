"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Tabs, Tab } from "@mui/material";
import EmployeeManagement from "../../components/EmployeeManagement";
import BranchManagement from "../../components/BranchManagement";
import Terms from "../../components/Terms";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <Box sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Salary Management Dashboard</Typography>
                <Button onClick={() => signOut({ callbackUrl: "/login" })} variant="outlined">Logout</Button>
            </Box>
            <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                <Tab label="Employees" />
                <Tab label="Branches" />
                <Tab label="Terms & Conditions" />
            </Tabs>
            {tab === 0 && <EmployeeManagement />}
            {tab === 1 && <BranchManagement />}
            {tab === 2 && <Terms />}
        </Box>
    );
}