"use client";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

interface Branch {
    _id: string;
    name: string;
}

export default function BranchManagement() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [name, setName] = useState("");
    const [editing, setEditing] = useState<Branch | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        const res = await fetch("/api/branches");
        const data = await res.json();
        setBranches(data);
    };

    const handleSubmit = async () => {
        const method = editing ? "PUT" : "POST";
        const url = editing ? `/api/branches/${editing._id}` : "/api/branches";
        const body = JSON.stringify({ name });

        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
        if (res.ok) {
            fetchBranches();
            setName("");
            setEditing(null);
            setOpen(false);
        }
    };

    const handleEdit = (branch: Branch) => {
        setEditing(branch);
        setName(branch.name);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
        if (res.ok) fetchBranches();
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Manage Branches</Typography>
            <Button variant="contained" onClick={() => { setEditing(null); setName(""); setOpen(true); }} sx={{ mb: 2 }}>Add Branch</Button>
            <List>
                {branches?.map((branch) => (
                    <ListItem key={branch._id} secondaryAction={
                        <>
                            <IconButton onClick={() => handleEdit(branch)}><Edit /></IconButton>
                            <IconButton onClick={() => handleDelete(branch._id)}><Delete /></IconButton>
                        </>
                    }>
                        <ListItemText primary={branch.name} />
                    </ListItem>
                ))}
            </List>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
                <DialogContent>
                    <TextField label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth margin="normal" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}