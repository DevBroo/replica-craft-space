import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    accessToken?: string;
    refreshToken?: string;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
    isOpen,
    onClose,
    accessToken,
    refreshToken
}) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError("Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters");
            setLoading(false);
            return;
        }

        try {
            // Set the session first if we have tokens
            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (sessionError) {
                    throw sessionError;
                }
            }

            // Update the password
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
                return;
            }

            setSuccess(true);
            toast({
                title: 'Password Updated',
                description: 'Your password has been successfully updated.',
            });

            // Close modal after 2 seconds
            setTimeout(() => {
                onClose();
                // Reset form
                setPassword('');
                setConfirmPassword('');
                setSuccess(false);
                setError(null);
            }, 2000);

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset form
        setPassword('');
        setConfirmPassword('');
        setSuccess(false);
        setError(null);
    };

    if (!isOpen) return null;

    const validation = validatePassword(password);

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="mt-4 text-xl font-bold text-gray-900">
                            Password Updated!
                        </CardTitle>
                        <CardDescription className="mt-2 text-gray-600">
                            Your password has been successfully updated. You can now use your new password to sign in.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold text-gray-900">
                            Reset Your Password
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardDescription className="text-gray-600">
                        Enter your new password below. Make sure it's strong and secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password && (
                                <div className="mt-2 text-xs space-y-1">
                                    <p className="text-gray-600 font-medium">Password requirements:</p>
                                    <div className={`flex items-center ${validation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        At least 8 characters
                                    </div>
                                    <div className={`flex items-center ${validation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        One uppercase letter
                                    </div>
                                    <div className={`flex items-center ${validation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        One lowercase letter
                                    </div>
                                    <div className={`flex items-center ${validation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        One number
                                    </div>
                                    <div className={`flex items-center ${validation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        One special character
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </Label>
                            <div className="mt-1 relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pr-10"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !validation.isValid || password !== confirmPassword}
                        >
                            {loading ? "Updating password..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};


