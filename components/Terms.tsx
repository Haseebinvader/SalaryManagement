"use client";
import { Box, Typography, Paper } from "@mui/material";

export default function Terms() {
    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Terms and Conditions</Typography>
            <Paper sx={{ p: 2, mt: 1 }}>
                <Typography variant="body1">
                    <strong>1. Resignation Policy:</strong> If an employee resigns immediately or without proper notice, one month's salary will be deducted.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>2. Loan Repayment:</strong> Employees must repay loans as per the agreed schedule. Failure to do so may result in deductions from salary.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>3. Salary Components:</strong> Salary includes basic pay, product rebate, points rebate, and performance rebate. Deductions include house rent, food expenses, and loan repayments.
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>4. Branch Assignment:</strong> Employees are assigned to branches and their performance is evaluated accordingly.
                </Typography>
                {/* Add more rules as needed */}
            </Paper>
        </Box>
    );
}