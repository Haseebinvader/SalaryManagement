"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { TextField, Button, Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface LoginForm {
    email: string;
    password: string;
}

export default function Login() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password,
        });
        setLoading(false);
        if (res?.ok) {
            router.push("/dashboard");
        } else {
            setError("Invalid credentials");
        }
    };

    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Admin Login</Typography>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', maxWidth: 400 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    label="Email"
                    fullWidth
                    margin="normal"
                    {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                />
                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    {...register("password", { required: "Password is required" })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, mb: 2 }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : "Login"}
                </Button>
            </Box>
        </Box>
    );
}
