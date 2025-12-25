"use client";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip, Avatar, TablePagination, CircularProgress, Backdrop } from "@mui/material";
import { Delete, Edit, Add, Person, Business, AttachMoney, AccountBalance, Visibility, PictureAsPdf, Print } from "@mui/icons-material";
import { toast } from "react-toastify";
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
const logoUrl = "/visionlogo.jpeg"; 
interface Branch {
    _id: string;
    name: string;
}

interface Employee {
    _id: string;
    employeeId: string;
    name: string;
    branchId: Branch | null;
    salaryMonth: string;
    basicPay: number;
    productRebate: number;
    pointsRebate: number;
    performanceRebate: number;
    houseRentDeduction: number;
    foodDeduction: number;
    loanDeduction: number;
    loanRemaining: number;
    createdAt: Date;
}

export default function EmployeeManagement() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [searchName, setSearchName] = useState("");
    const [searchId, setSearchId] = useState("");
    const [branchName, setBranchName] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };
    const getInitialMonth = () => new Date().toLocaleString('en-US', { month: 'long' });
    const getInitialYear = () => new Date().getFullYear().toString();

    const [form, setForm] = useState({
        employeeId: "",
        name: "",
        branchId: "",
        salaryMonth: "",
        salaryMonthValue: getInitialMonth(),
        salaryYearValue: getInitialYear(),
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
            const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };
    
    const filteredEmployees = employees.filter((emp) => {
        const matchName = emp.name.toLowerCase().includes(searchName.toLowerCase());
        const matchId = emp.employeeId?.toLowerCase().includes(searchId.toLowerCase()) ?? true;
        const matchBranch = emp.branchId?.name.toLowerCase().includes(branchName.toLowerCase()) ?? true;

        let matchMonth = true;
        if (selectedMonth !== "all" && emp.salaryMonth) {
            // Convert salaryMonth (e.g., "December 2025") to format like "2025-12"
            try {
                const date = new Date(emp.salaryMonth + " 1");
                if (!isNaN(date.getTime())) {
                    const empMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    matchMonth = empMonthYear === selectedMonth;
                }
            } catch (e) {
                // If parsing fails, check if it matches the selectedMonth format directly
                matchMonth = emp.salaryMonth.toLowerCase().includes(selectedMonth.toLowerCase());
            }
        }

        return matchName && matchId && matchBranch && matchMonth;
    });

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/employees");
            if (!res.ok) throw new Error("Failed to fetch employees");
            const data = await res.json();
            // Handle new API response structure with pagination
            if (data.employees && Array.isArray(data.employees)) {
                setEmployees(data.employees);
            } else if (Array.isArray(data)) {
                // Fallback for old structure
                setEmployees(data);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch employees. Please try again.");
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch("/api/branches");
            if (!res.ok) throw new Error("Failed to fetch branches");
            const data = await res.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch branches. Please try again.");
            setBranches([]);
        }
    };

    const handleSubmit = async () => {
        if (!form.employeeId.trim()) {
            toast.error("Please enter employee ID");
            return;
        }
        if (!form.name.trim()) {
            toast.error("Please enter employee name");
            return;
        }
        if (!form.branchId) {
            toast.error("Please select a branch");
            return;
        }
        if (!form.salaryMonthValue || !form.salaryYearValue) {
            toast.error("Please select both month and year for salary");
            return;
        }

        // Combine month and year into salaryMonth string
        const trimmedSalaryMonth = `${form.salaryMonthValue} ${form.salaryYearValue}`;

        // Check for duplicate employeeId + salaryMonth combination
        const trimmedEmployeeId = form.employeeId.trim();
        const duplicateEmployee = employees.find(
            (emp) =>
                emp.employeeId?.toLowerCase() === trimmedEmployeeId.toLowerCase() &&
                emp.salaryMonth?.toLowerCase() === trimmedSalaryMonth.toLowerCase() &&
                (!editing || emp._id !== editing._id) // Exclude current employee when editing
        );

        if (duplicateEmployee) {
            toast.error(
                `An employee with ID "${trimmedEmployeeId}" already exists for the salary month "${trimmedSalaryMonth}". Please use a different month or update the existing record.`
            );
            return;
        }

        setSubmitting(true);
        try {
        const repaymentAmount = parseFloat(form.repaymentAmount) || 0;
        const dataToSend = {
            employeeId: trimmedEmployeeId,
            name: form.name.trim(),
            branchId: form.branchId,
            salaryMonth: trimmedSalaryMonth,
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
                toast.success(editing ? "Employee updated successfully" : "Employee added successfully");
                await fetchEmployees();
            resetForm();
            setOpen(false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                // Show specific error message from backend, especially for duplicate entries
                const errorMessage = errorData.error || errorData.message || (editing ? "Failed to update employee" : "Failed to add employee");
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
        setForm({
            employeeId: "",
            name: "",
            branchId: "",
            salaryMonth: "",
            salaryMonthValue: currentMonth,
            salaryYearValue: currentYear.toString(),
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

    // Helper function to parse salaryMonth string (e.g., "December 2025") into month and year
    const parseSalaryMonth = (salaryMonth: string) => {
        if (!salaryMonth) {
            const now = new Date();
            return {
                month: now.toLocaleString('en-US', { month: 'long' }),
                year: now.getFullYear().toString()
            };
        }
        const parts = salaryMonth.trim().split(' ');
        if (parts.length >= 2) {
            return {
                month: parts[0],
                year: parts[parts.length - 1]
            };
        }
        // Fallback: try to parse as date
        try {
            const date = new Date(salaryMonth + " 1");
            if (!isNaN(date.getTime())) {
                return {
                    month: date.toLocaleString('en-US', { month: 'long' }),
                    year: date.getFullYear().toString()
                };
            }
        } catch (e) {
            // Ignore parsing errors
        }
        const now = new Date();
        return {
            month: now.toLocaleString('en-US', { month: 'long' }),
            year: now.getFullYear().toString()
        };
    };

    // Generate month options
    const getMonthOptions = () => {
        return [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    };

    // Generate year options (current year ± 5 years)
    const getYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            years.push(i.toString());
        }
        return years;
    };

    const handleEdit = (employee: Employee) => {
        setEditing(employee);
        const { month, year } = parseSalaryMonth(employee.salaryMonth || '');
        setForm({
            employeeId: employee.employeeId || '',
            name: employee.name,
            branchId: employee.branchId?._id || '',
            salaryMonth: employee.salaryMonth || '',
            salaryMonthValue: month,
            salaryYearValue: year,
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
        if (!window.confirm("Are you sure you want to delete this employee?")) {
            return;
        }

        setDeleting(id);
        try {
        const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Employee deleted successfully");
                await fetchEmployees();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.message || "Failed to delete employee");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while deleting. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    const calculateGross = (emp: Employee) => emp.basicPay + emp.productRebate + emp.pointsRebate + emp.performanceRebate;
    const calculateNet = (emp: Employee) => calculateGross(emp) - emp.houseRentDeduction - emp.foodDeduction - emp.loanDeduction;

    const handlePrint = (employee: Employee | null) => {
        if (!employee || typeof window === "undefined") return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        const salaryMonth = employee?.salaryMonth || new Date(employee?.createdAt || new Date()).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Salary Slip - ${employee.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                    .header { display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
                    .logo { height: 80px; margin-right: 15px; }
                    .company { font-size: 22px; font-weight: bold; color: #1976d2; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 10px; border: 1px solid #ddd; }
                    th { background: #f5f7fa; text-align: left; }
                    .total { font-weight: bold; background: #e3f2fd; }
                    .p{font-size: 24px;  fontweight: bolder;}
                </style>
            </head>
            <body>
    
                <div class="header">
                    <img src="${logoUrl}" class="logo" />
                    <div class="company">Secure Vision</div>
                    </div>
                    <h2>Salary Slip for Month of ${salaryMonth}</h2>
    
                <p class="p"><strong>Employee:</strong> ${employee.name}</p>
                <p class="p"><strong>Branch:</strong> ${employee.branchId?.name || ""}</p>
    
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

    const handleDownloadPDF = (employee: Employee | null) => {
        if (!employee) return;

        const doc = new jsPDF("p", "mm", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPosition = 20;

        // Logo
        try {
            doc.addImage(logoUrl, "JPEG", margin, yPosition, 40, 40);
        } catch (e) {
            console.warn("Logo not loaded");
        }

        // Company Name
        doc.setFontSize(24); // increased
        doc.setFont("helvetica", "bold");
        doc.setTextColor(158, 158, 158);
        doc.text("Secure Vision", margin + 50, yPosition + 14);

        const salaryMonth = employee?.salaryMonth || new Date(employee?.createdAt || new Date()).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(90);
        doc.text(`Salary Slip for Month ${salaryMonth}`, margin + 50, yPosition + 33);


        yPosition += 50;

        // Employee Details
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Employee:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(employee.name, margin + 50, yPosition);

        yPosition += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Branch:", margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(employee.branchId?.name || "N/A", margin + 50, yPosition);

        yPosition += 20;

        // Earnings Table
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(25, 118, 210);
        doc.text("Earnings", margin, yPosition);
        yPosition += 10;

        autoTable(doc, {
            startY: yPosition,
            head: [["Description", "Amount"]],
            body: [
                ["Basic Pay", employee.basicPay.toFixed(2)],
                ["Product Rebate", employee.productRebate.toFixed(2)],
                ["Points Rebate", employee.pointsRebate.toFixed(2)],
                ["Performance Rebate", employee.performanceRebate.toFixed(2)],
                ["Gross Pay", calculateGross(employee).toFixed(2)],
            ],
            theme: "grid",
            headStyles: {
                fillColor: [158, 158, 158], // MUI grey
                textColor: 255,
                fontStyle: "bold",
                halign: "center", // 👈 center header text
            },
            styles: {
                fontSize: 11,
                cellPadding: 5,
                halign: "center", // 👈 center body cells
            },
            columnStyles: {
                0: { halign: "center" }, // Description column
                1: { halign: "center", fontStyle: "bold" }, // Amount column
            },
            margin: { left: margin, right: margin },
        });
        

        yPosition = (doc as any).lastAutoTable.finalY + 20;

        // Deductions Table
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(244, 67, 54); // MUI error red
        doc.text("Deductions", margin, yPosition);
        yPosition += 10;

        autoTable(doc, {
            startY: yPosition,
            head: [["Description", "Amount"]],
            body: [
                ["House Rent Deduction", employee.houseRentDeduction.toFixed(2)],
                ["Food Deduction", employee.foodDeduction.toFixed(2)],
                ["Loan Deduction", employee.loanDeduction.toFixed(2)],
                ["Total Deductions", (
                    employee.houseRentDeduction +
                    employee.foodDeduction +
                    employee.loanDeduction
                ).toFixed(2)],
            ],
            theme: "grid",
            headStyles: { fillColor: [244, 67, 54], textColor: 255, fontStyle: "bold" ,        halign: "center", // center header text
                },
            styles: { fontSize: 11, cellPadding: 5 ,        halign: "center", // center body cells
                },
            columnStyles: { 1: { halign: "center", fontStyle: "bold" } },
            margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // Net Pay Highlight
        const netPay = calculateNet(employee);
        doc.setFillColor(232, 245, 233); // light green background
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 14, "F");
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(158, 158, 158); // gray color
        doc.text(`Net Pay: ${netPay.toFixed(2)}`, pageWidth / 2, yPosition + 9, { align: "center" });

        yPosition += 30;

        // Outstanding Loan (if any)
        if (employee.loanRemaining > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(244, 67, 54); // red color
            doc.text(
                `Remaining Loan Balance: ${employee.loanRemaining.toFixed(2)}`,
                margin,
                yPosition
            );
            yPosition += 20;
        }
        

        // Terms and Conditions Section
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Terms and Conditions", margin, yPosition);
        yPosition += 8;

        const terms = [
            "1. Salary payments are made on the last working day of each month.",
            "2. All deductions are as per company policy and applicable laws.",
            "3. Loan repayments will be deducted from salary until the loan is fully repaid.",
            "4. Employees must maintain confidentiality of company information.",
            "5. Any changes to salary components must be approved by management.",
            "6. This document is generated electronically and is legally binding.",
        ];

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);
        terms.forEach((term) => {
            const splitTerm = doc.splitTextToSize(term, pageWidth - 2 * margin);
            doc.text(splitTerm, margin, yPosition);
            yPosition += splitTerm.length * 5 + 2; // spacing between lines
        });

        yPosition += 10;

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("This is a system-generated document. No signature required.", margin, pageHeight - 10);

        // Optional: Add date
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.text(`Generated on: ${today}`, pageWidth - margin, pageHeight - 10, { align: "right" });

        // Save PDF
        const fileName = `Salary_Slip_${employee.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
    };

    return (
        <Box sx={{ mt: 4, px: 2 }}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
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
                                label="Search by Employee ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
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

                            {(searchName || searchId || branchName || selectedMonth !== "all") && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setSearchName("");
                                        setSearchId("");
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
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Employee ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Branch</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Salary Month</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Basic Pay</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Product Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Points Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Performance Rebate</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>House Rent</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Food Expense</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Loan Deduction</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Gross Pay</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Loan Remaining</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={14} align="center">
                                            <CircularProgress size={24} sx={{ my: 2 }} />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={14} align="center">
                                            <Typography color="text.secondary">
                                                No employees found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                                {filteredEmployees
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((emp) => (
                                        <TableRow key={emp._id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                {emp.employeeId || 'N/A'}
                                            </TableCell>
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
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {emp.salaryMonth || 'N/A'}
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
                                                    disabled={deleting === emp._id}
                                                >
                                                    {deleting === emp._id ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                    <Delete fontSize="small" />
                                                    )}
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={filteredEmployees.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        />
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
                                label="Employee ID"
                                value={form.employeeId}
                                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                                fullWidth
                                variant="outlined"
                                required
                            />
                            <TextField
                                size="small"
                                label="Employee Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                fullWidth
                                variant="outlined"
                                required
                            />
                        </Box>
                        <Box display="flex" gap={2}>
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
                            <FormControl size="small" sx={{ flex: '1 1 200px' }} variant="outlined">
                                <InputLabel>Salary Month</InputLabel>
                                <Select
                                    value={form.salaryMonthValue}
                                    onChange={(e) => setForm({ ...form, salaryMonthValue: e.target.value })}
                                    label="Salary Month"
                                    required
                                >
                                    {getMonthOptions().map((month) => (
                                        <MenuItem key={month} value={month}>
                                            {month}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ flex: '1 1 150px' }} variant="outlined">
                                <InputLabel>Year</InputLabel>
                                <Select
                                    value={form.salaryYearValue}
                                    onChange={(e) => setForm({ ...form, salaryYearValue: e.target.value })}
                                    label="Year"
                                    required
                                >
                                    {getYearOptions().map((year) => (
                                        <MenuItem key={year} value={year}>
                                            {year}
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
                        disabled={submitting}
                    >
                        {submitting ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
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
                                        label="Employee ID"
                                        value={selectedEmployee.employeeId || ''}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                    />
                                    <TextField
                                        label="Employee Name"
                                        value={selectedEmployee.name}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                    />
                                </Box>
                                <Box display="flex" gap={2}>
                                    <TextField
                                        label="Branch"
                                        value={selectedEmployee.branchId?.name || ''}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        variant="outlined"
                                    />
                                    <TextField
                                        label="Salary Month"
                                        value={selectedEmployee.salaryMonth || ''}
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