"use client";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip, Avatar } from "@mui/material";
import { Delete, Edit, Add, Person, Business, AttachMoney, AccountBalance, Visibility, PictureAsPdf, Print } from "@mui/icons-material";
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // This enables autoTable
const logoUrl = "/visionlogo.jpeg"; // served statically
interface Branch {
    _id: string;
    name: string;
}

interface Employee {
    _id: string;
    name: string;
    branchId: Branch | null;
    basicPay: number;
    productRebate: number;
    pointsRebate: number;
    performanceRebate: number;
    houseRentDeduction: number;
    foodDeduction: number;
    loanDeduction: number;
    loanRemaining: number;
}

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [searchName, setSearchName] = useState("");
    const [searchId, setSearchId] = useState("");
    const [branchName, setBranchName] = useState("");

    const [form, setForm] = useState({
        name: "",
        branchId: "",
        basicPay: '',
        productRebate: '',
        pointsRebate: '',
        performanceRebate: '',
        houseRentDeduction: '',
        foodDeduction: '',
        loanDeduction: '',
        loanRemaining: '',
        repaymentAmount: '',
    });
    const [editing, setEditing] = useState<Employee | null>(null);
    const [open, setOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedMonth, setSelectedMonth] = useState("all");
    const generateMonthOptions = () => {
        const options = [
            { value: "all", label: "All Months" }
        ];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleString('en-US', { month: 'long' });
            options.push({ value, label });
        }
        return options;
    };
    const filteredEmployees = employees.filter((emp) => {
        const matchName = emp.name.toLowerCase().includes(searchName.toLowerCase());
        const matchBranch = emp.branchId?.name.toLowerCase().includes(branchName.toLowerCase()) ?? true;

        let matchMonth = true;
        if (selectedMonth !== "all" && emp.createdAt) {
            const empDate = new Date(emp.createdAt);
            const empMonthYear = `${empDate.getFullYear()}-${String(empDate.getMonth() + 1).padStart(2, '0')}`;
            matchMonth = empMonthYear === selectedMonth;
        }

        return matchName && matchBranch && matchMonth;
    });

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/employees");
            if (!res.ok) throw new Error("Failed to fetch employees");
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setEmployees([]);
        }
    };

    console.log(employees);



    const fetchBranches = async () => {
        try {
            const res = await fetch("/api/branches");
            if (!res.ok) throw new Error("Failed to fetch branches");
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setBranches([]);
        }
    };

    const handleSubmit = async () => {
        const repaymentAmount = parseFloat(form.repaymentAmount) || 0;
        const dataToSend = {
            name: form.name,
            branchId: form.branchId,
            basicPay: parseFloat(form.basicPay) || 0,
            productRebate: parseFloat(form.productRebate) || 0,
            pointsRebate: parseFloat(form.pointsRebate) || 0,
            performanceRebate: parseFloat(form.performanceRebate) || 0,
            houseRentDeduction: parseFloat(form.houseRentDeduction) || 0,
            foodDeduction: parseFloat(form.foodDeduction) || 0,
            loanDeduction: parseFloat(form.loanDeduction) || 0,
            loanRemaining: parseFloat(form.loanRemaining) || 0,
        };
        if (editing && repaymentAmount > 0) {
            dataToSend.loanRemaining = Math.max(0, dataToSend.loanRemaining - repaymentAmount);
        }

        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/employees/${editing._id}` : "/api/employees";

        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend) });
        if (res.ok) {
            fetchEmployees();
            resetForm();
            setOpen(false);
        }
    };

    const resetForm = () => {
        setForm({
            name: "",
            branchId: "",
            basicPay: '',
            productRebate: '',
            pointsRebate: '',
            performanceRebate: '',
            houseRentDeduction: '',
            foodDeduction: '',
            loanDeduction: '',
            loanRemaining: '',
            repaymentAmount: '',
        });
        setEditing(null);
    };

    const handleEdit = (employee: Employee) => {
        setEditing(employee);
        setForm({
            name: employee.name,
            branchId: employee.branchId?._id || '',
            basicPay: employee.basicPay.toString(),
            productRebate: employee.productRebate.toString(),
            pointsRebate: employee.pointsRebate.toString(),
            performanceRebate: employee.performanceRebate.toString(),
            houseRentDeduction: employee.houseRentDeduction.toString(),
            foodDeduction: employee.foodDeduction.toString(),
            loanDeduction: employee.loanDeduction.toString(),
            loanRemaining: employee.loanRemaining.toString(),
            repaymentAmount: '',
        });
        setOpen(true);
    };

    const handleView = (employee: Employee) => {
        setSelectedEmployee(employee);
        setViewOpen(true);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
        if (res.ok) fetchEmployees();
    };

    const calculateGross = (emp: Employee) => emp.basicPay + emp.productRebate + emp.pointsRebate + emp.performanceRebate;
    const calculateNet = (emp: Employee) => calculateGross(emp) - emp.houseRentDeduction - emp.foodDeduction - emp.loanDeduction;

    const handlePrint = (employee: Employee | null) => {
        if (!employee || typeof window === "undefined") return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>Salary Slip - ${employee.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                    .header { display: flex; align-items: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
                    .logo { height: 80px; margin-right: 15px; }
                    .company { font-size: 22px; font-weight: bold; color: #1976d2; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 10px; border: 1px solid #ddd; }
                    th { background: #f5f7fa; text-align: left; }
                    .total { font-weight: bold; background: #e3f2fd; }
                </style>
            </head>
            <body>
    
                <div class="header">
                    <img src="${logoUrl}" class="logo" />
                    <div class="company">Vision Management</div>
                </div>
    
                <p><strong>Employee:</strong> ${employee.name}</p>
                <p><strong>Branch:</strong> ${employee.branchId?.name || ""}</p>
    
                <h3>Earnings</h3>
                <table>
                    <tr><th>Basic Pay</th><td>${employee.basicPay}</td></tr>
                    <tr><th>Product Rebate</th><td>${employee.productRebate}</td></tr>
                    <tr><th>Points Rebate</th><td>${employee.pointsRebate}</td></tr>
                    <tr><th>Performance Rebate</th><td>${employee.performanceRebate}</td></tr>
                    <tr class="total"><th>Gross Pay</th><td>${calculateGross(employee)}</td></tr>
                </table>
    
                <h3>Deductions</h3>
                <table>
                    <tr><th>House Rent</th><td>${employee.houseRentDeduction}</td></tr>
                    <tr><th>Food</th><td>${employee.foodDeduction}</td></tr>
                    <tr><th>Loan</th><td>${employee.loanDeduction}</td></tr>
                    <tr class="total"><th>Net Pay</th><td>${calculateNet(employee)}</td></tr>
                </table>
    
                <p style="margin-top:40px;font-size:12px;color:#777;">
                    This is a system-generated salary slip.
                </p>
    <div class="section terms">
                        <h2>Terms and Conditions</h2>
                        <p>1. Salary payments are made on the last working day of each month.</p>
                        <p>2. All deductions are as per company policy and applicable laws.</p>
                        <p>3. Loan repayments will be deducted from salary until the loan is fully repaid.</p>
                        <p>4. Employees must maintain confidentiality of company information.</p>
                        <p>5. Any changes to salary components must be approved by management.</p>
                        <p>6. This document is generated electronically and is legally binding.</p>
                    </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };



    const handleDownloadPDF = async (employee: Employee | null) => {
        if (!employee) return;

        const doc = new jsPDF("p", "mm", "a4");

        try {
            // Load logo safely
            let logoData = null;
            try {
                const img = new Image();
                img.src = logoUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    logoData = canvas.toDataURL("image/jpeg");
                }
            } catch (e) {
                console.warn("Logo not found or failed to load – continuing without logo");
            }

            let y = 20; // Starting position

            // Logo
            if (logoData) {
                doc.addImage(logoData, "JPEG", 15, y, 40, 30);
                y += 40;
            } else {
                y += 10;
            }

            // Company Name
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Vision Management", 70, y);
            y += 10;

            // Title
            doc.setFontSize(18);
            doc.text("Salary Slip", 70, y);
            y += 15;

            // Employee Details
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Employee Name: ${employee.name}`, 20, y);
            y += 8;
            doc.text(`Branch: ${employee.branchId?.name || "N/A"}`, 20, y);
            y += 15;

            // Earnings
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Earnings", 20, y);
            y += 10;

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Basic Pay:           ${employee.basicPay.toFixed(2)}`, 30, y);
            y += 8;
            doc.text(`Product Rebate:      ${employee.productRebate.toFixed(2)}`, 30, y);
            y += 8;
            doc.text(`Points Rebate:       ${employee.pointsRebate.toFixed(2)}`, 30, y);
            y += 8;
            doc.text(`Performance Rebate:  ${employee.performanceRebate.toFixed(2)}`, 30, y);
            y += 10;
            doc.text(`Gross Pay:           ${calculateGross(employee).toFixed(2)}`, 30, y);
            y += 20;

            // Deductions
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Deductions", 20, y);
            y += 10;

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`House Rent:          ${employee.houseRentDeduction.toFixed(2)}`, 30, y);
            y += 8;
            doc.text(`Food:                ${employee.foodDeduction.toFixed(2)}`, 30, y);
            y += 8;
            doc.text(`Loan Deduction:      ${employee.loanDeduction.toFixed(2)}`, 30, y);
            y += 10;
            doc.text(`Net Pay:             ${calculateNet(employee).toFixed(2)}`, 30, y);
            y += 15;

            // Loan Remaining
            doc.text(`Loan Remaining:      ${employee.loanRemaining.toFixed(2)}`, 30, y);
            y += 25;

            // Terms and Conditions
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Terms and Conditions", 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("• Salary is paid on the last working day of the month.", 25, y);
            y += 6;
            doc.text("• All deductions are as per company policy and law.", 25, y);
            y += 6;
            doc.text("• Loan repayments are deducted automatically until cleared.", 25, y);
            y += 6;
            doc.text("• This is a system-generated document. No signature required.", 25, y);
            y += 6;
            doc.text("• Employees must maintain confidentiality of salary details.", 25, y);
            y += 15;

            // Footer with date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Generated on: 21 December 2025", 20, y);
            doc.text("Vision Management © 2025", 120, y);

            // Save PDF
            doc.save(`${employee.name.replace(/\s+/g, "_")}_Salary_Slip.pdf`);

        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate PDF. Check console or logo file.");
        }
    };

    return (
        <Box sx={{ mt: 4, px: 2 }}>
            <Card elevation={3} sx={{ mb: 4 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Box display="flex" alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                <Person />
                            </Avatar>
                            <Typography variant="h5" component="h2" fontWeight="bold">
                                Employee Management
                            </Typography>
                        </Box>
                        <Box
                            display="flex"
                            gap={2}
                            mb={3}
                            flexWrap="wrap"
                            alignItems="center"
                        >
                            <TextField
                                size="small"
                                label="Search by Name"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />

                            <TextField
                                size="small"
                                label="Search by Branch Name"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                sx={{ minWidth: 220 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 220 }}>
                                <InputLabel>Filter by Month</InputLabel>
                                <Select
                                    value={selectedMonth}
                                    label="Filter by Month"
                                    onChange={(e) => setSelectedMonth(e.target.value as string)}
                                >
                                    {generateMonthOptions().map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {(searchName || branchName|| selectedMonth !== "all") && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setSearchName("");
                                        setBranchName("");
                                        setSelectedMonth("all");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => { resetForm(); setOpen(true); }}
                            sx={{ borderRadius: 2, px: 3, fontSize: '12px' }}
                            size="small"

                        >
                            Add Employee
                        </Button>
                    </Box>
                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Branch</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Basic Pay</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Product Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Points Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Performance Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>House Rent</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Food Expense</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Loan Deduction</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Gross Pay</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Loan Remaining</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Monthly Salary</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmployees.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={12} align="center">
                                            <Typography color="text.secondary">
                                                No employees found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredEmployees?.map((emp) => (
                                    <TableRow key={emp._id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'secondary.main' }}>
                                                    {emp.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="medium">{emp.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Business />}
                                                label={emp.branchId?.name || ''}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.basicPay}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.productRebate}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.pointsRebate}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.performanceRebate}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.houseRentDeduction}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.foodDeduction}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{emp.loanDeduction}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'success.main' }}>
                                            {calculateGross(emp)}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', color: 'warning.main' }}>
                                            <Box display="flex" alignItems="center">
                                                <AccountBalance sx={{ mr: 1, fontSize: 16 }} />
                                                {emp.loanRemaining}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {new Date(emp?.createdAt || new Date()).toLocaleString('en-US', { month: 'long' })}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleView(emp)}
                                                sx={{ color: 'info.main', mr: 1 }}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(emp)}
                                                sx={{ color: 'primary.main', mr: 1 }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(emp._id)}
                                                sx={{ color: 'error.main' }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: editing ? 'warning.main' : 'success.main', mr: 2 }}>
                            {editing ? <Edit /> : <Add />}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">
                            {editing ? "Edit Employee" : "Add New Employee"}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Box display="flex" gap={2}>
                            <TextField
                                size="small"
                                label="Employee Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                fullWidth
                                variant="outlined"
                            />
                            <FormControl size="small" sx={{ minWidth: 200 }} variant="outlined">
                                <InputLabel>Branch</InputLabel>
                                <Select
                                    value={form.branchId}
                                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                    label="Branch"
                                >
                                    {branches?.map((b) => (
                                        <MenuItem key={b._id} value={b._id}>
                                            <Box display="flex" alignItems="center">
                                                <Business sx={{ mr: 1, fontSize: 18 }} />
                                                {b.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
                            <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Earnings
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            <TextField
                                label="Basic Pay"
                                type="number"
                                value={form.basicPay}
                                onChange={(e) => setForm({ ...form, basicPay: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                            <TextField
                                label="Product Rebate"
                                type="number"
                                value={form.productRebate}
                                onChange={(e) => setForm({ ...form, productRebate: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                            <TextField
                                label="Points Rebate"
                                type="number"
                                value={form.pointsRebate}
                                onChange={(e) => setForm({ ...form, pointsRebate: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                            <TextField
                                label="Performance Rebate"
                                type="number"
                                value={form.performanceRebate}
                                onChange={(e) => setForm({ ...form, performanceRebate: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                        </Box>

                        <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'error.main' }}>
                            Deductions
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                            <TextField
                                label="House Rent Deduction"
                                type="number"
                                value={form.houseRentDeduction}
                                onChange={(e) => setForm({ ...form, houseRentDeduction: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                            <TextField
                                label="Food Deduction"
                                type="number"
                                value={form.foodDeduction}
                                onChange={(e) => setForm({ ...form, foodDeduction: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                            <TextField
                                label="Loan Deduction"
                                type="number"
                                value={form.loanDeduction}
                                onChange={(e) => setForm({ ...form, loanDeduction: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                size="small"
                                variant="outlined"
                            />
                        </Box>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body1" fontWeight="medium">
                                <strong>Gross Pay:</strong> {(
                                    (parseFloat(form.basicPay) || 0) +
                                    (parseFloat(form.productRebate) || 0) +
                                    (parseFloat(form.pointsRebate) || 0) +
                                    (parseFloat(form.performanceRebate) || 0)
                                )}
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                <strong>Net Pay:</strong> {(
                                    (parseFloat(form.basicPay) || 0) +
                                    (parseFloat(form.productRebate) || 0) +
                                    (parseFloat(form.pointsRebate) || 0) +
                                    (parseFloat(form.performanceRebate) || 0) -
                                    (parseFloat(form.houseRentDeduction) || 0) -
                                    (parseFloat(form.foodDeduction) || 0) -
                                    (parseFloat(form.loanDeduction) || 0)
                                )}
                            </Typography>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
                            <TextField
                                size="small"
                                label="Loan Remaining"
                                type="number"
                                value={form.loanRemaining}
                                onChange={(e) => setForm({ ...form, loanRemaining: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                                variant="outlined"
                            />
                            {editing && (() => {
                                const newLoanRemaining = Math.max(0, (parseFloat(form.loanRemaining) || 0) - (parseFloat(form.repaymentAmount) || 0));
                                return (
                                    <TextField
                                        size="small"
                                        label="Loan Repayment Amount"
                                        type="number"
                                        value={form.repaymentAmount}
                                        onChange={(e) => setForm({ ...form, repaymentAmount: e.target.value })}
                                        sx={{ flex: '1 1 200px' }}
                                        variant="outlined"
                                        helperText={`New: ${newLoanRemaining}`}
                                    />
                                );
                            })()}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        {editing ? "Update Employee" : "Add Employee"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Employee Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
                    <Visibility sx={{ mr: 1 }} />
                    Employee Details
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 2 }}>
                        {selectedEmployee && (
                            <>
                                <Box display="flex" gap={2}>
                                    <TextField
                                        label="Employee Name"
                                        value={selectedEmployee.name}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                    />
                                    <TextField
                                        label="Branch"
                                        value={selectedEmployee.branchId?.name || ''}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                    />
                                </Box>

                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <TextField
                                        label="Basic Pay"
                                        value={selectedEmployee.basicPay}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Product Rebate"
                                        value={selectedEmployee.productRebate}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Points Rebate"
                                        value={selectedEmployee.pointsRebate}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Performance Rebate"
                                        value={selectedEmployee.performanceRebate}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                </Box>

                                <Box display="flex" flexWrap="wrap" gap={2}>
                                    <TextField
                                        label="House Rent Deduction"
                                        value={selectedEmployee.houseRentDeduction}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Food Deduction"
                                        value={selectedEmployee.foodDeduction}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Loan Deduction"
                                        value={selectedEmployee.loanDeduction}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                    <TextField
                                        label="Loan Remaining"
                                        value={selectedEmployee.loanRemaining}
                                        type="number"
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                        sx={{ flex: '1 1 200px' }}
                                    />
                                </Box>

                                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                        <strong>Gross Pay:</strong> {(
                                            selectedEmployee.basicPay +
                                            selectedEmployee.productRebate +
                                            selectedEmployee.pointsRebate +
                                            selectedEmployee.performanceRebate
                                        )}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        <strong>Net Pay:</strong> {(
                                            selectedEmployee.basicPay +
                                            selectedEmployee.productRebate +
                                            selectedEmployee.pointsRebate +
                                            selectedEmployee.performanceRebate -
                                            selectedEmployee.houseRentDeduction -
                                            selectedEmployee.foodDeduction -
                                            selectedEmployee.loanDeduction
                                        )}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        Terms and Conditions
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        1. Salary payments are made on the last working day of each month.<br />
                                        2. All deductions are as per company policy and applicable laws.<br />
                                        3. Loan repayments will be deducted from salary until the loan is fully repaid.<br />
                                        4. Employees must maintain confidentiality of company information.<br />
                                        5. Any changes to salary components must be approved by management.<br />
                                        6. This document is generated electronically and is legally binding.
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setViewOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={() => handlePrint(selectedEmployee)}
                        startIcon={<Print />}
                        variant="outlined"
                        sx={{ borderRadius: 2, px: 3, mr: 1 }}
                    >
                        Print
                    </Button>
                    <Button
                        onClick={() => handleDownloadPDF(selectedEmployee)}
                        startIcon={<PictureAsPdf />}
                        variant="contained"
                        sx={{ borderRadius: 2, px: 3 }}
                    >
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}