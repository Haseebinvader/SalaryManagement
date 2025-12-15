"use client";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip, Avatar } from "@mui/material";
import { Delete, Edit, Add, Person, Business, AttachMoney, AccountBalance, Visibility, PictureAsPdf, Print } from "@mui/icons-material";
import jsPDF from 'jspdf';

interface Branch {
    _id: string;
    name: string;
}

interface Employee {
    _id: string;
    name: string;
    branchId: Branch;
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

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    const fetchEmployees = async () => {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
    };

    const fetchBranches = async () => {
        const res = await fetch("/api/branches");
        const data = await res.json();
        setBranches(data);
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
            branchId: employee.branchId._id,
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
        if (!employee) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Employee Details - ${employee.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #1976d2; }
                        .section { margin-bottom: 20px; }
                        .field { margin-bottom: 10px; }
                        .label { font-weight: bold; }
                        .terms { background-color: #e3f2fd; padding: 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h1>Employee Details</h1>
                    <div class="section">
                        <div class="field"><span class="label">Name:</span> ${employee.name}</div>
                        <div class="field"><span class="label">Branch:</span> ${employee.branchId.name}</div>
                    </div>
                    <div class="section">
                        <h2>Earnings</h2>
                        <div class="field"><span class="label">Basic Pay:</span> ${employee.basicPay}</div>
                        <div class="field"><span class="label">Product Rebate:</span> ${employee.productRebate}</div>
                        <div class="field"><span class="label">Points Rebate:</span> ${employee.pointsRebate}</div>
                        <div class="field"><span class="label">Performance Rebate:</span> ${employee.performanceRebate}</div>
                        <div class="field"><span class="label">Gross Pay:</span> ${calculateGross(employee)}</div>
                    </div>
                    <div class="section">
                        <h2>Deductions</h2>
                        <div class="field"><span class="label">House Rent:</span> ${employee.houseRentDeduction}</div>
                        <div class="field"><span class="label">Food:</span> ${employee.foodDeduction}</div>
                        <div class="field"><span class="label">Loan:</span> ${employee.loanDeduction}</div>
                        <div class="field"><span class="label">Net Pay:</span> ${calculateNet(employee)}</div>
                        <div class="field"><span class="label">Loan Remaining:</span> ${employee.loanRemaining}</div>
                    </div>
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
            printWindow.print();
        }
    };

    const handleDownloadPDF = (employee: Employee | null) => {
        if (!employee) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Employee Details', 20, 20);
        doc.setFontSize(12);
        doc.text(`Name: ${employee.name}`, 20, 40);
        doc.text(`Branch: ${employee.branchId.name}`, 20, 50);
        doc.text('Earnings:', 20, 70);
        doc.text(`Basic Pay: ${employee.basicPay}`, 30, 80);
        doc.text(`Product Rebate: ${employee.productRebate}`, 30, 90);
        doc.text(`Points Rebate: ${employee.pointsRebate}`, 30, 100);
        doc.text(`Performance Rebate: ${employee.performanceRebate}`, 30, 110);
        doc.text(`Gross Pay: ${calculateGross(employee)}`, 30, 120);
        doc.text('Deductions:', 20, 140);
        doc.text(`House Rent: ${employee.houseRentDeduction}`, 30, 150);
        doc.text(`Food: ${employee.foodDeduction}`, 30, 160);
        doc.text(`Loan: ${employee.loanDeduction}`, 30, 170);
        doc.text(`Net Pay: ${calculateNet(employee)}`, 30, 180);
        doc.text(`Loan Remaining: ${employee.loanRemaining}`, 30, 190);
        doc.text('Terms and Conditions:', 20, 210);
        const terms = [
            '1. Salary payments are made on the last working day of each month.',
            '2. All deductions are as per company policy and applicable laws.',
            '3. Loan repayments will be deducted from salary until the loan is fully repaid.',
            '4. Employees must maintain confidentiality of company information.',
            '5. Any changes to salary components must be approved by management.',
            '6. This document is generated electronically and is legally binding.'
        ];
        let y = 220;
        terms.forEach(term => {
            doc.text(term, 30, y);
            y += 10;
        });
        doc.save(`${employee.name}_details.pdf`);
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
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => { resetForm(); setOpen(true); }}
                            sx={{ borderRadius: 2, px: 3 }}
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
                                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees?.map((emp) => (
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
                                                label={emp.branchId.name}
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
                                        value={selectedEmployee.branchId.name}
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
                                        1. Salary payments are made on the last working day of each month.<br/>
                                        2. All deductions are as per company policy and applicable laws.<br/>
                                        3. Loan repayments will be deducted from salary until the loan is fully repaid.<br/>
                                        4. Employees must maintain confidentiality of company information.<br/>
                                        5. Any changes to salary components must be approved by management.<br/>
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