import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Shield, Lock, Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ResetPasswordModal } from '@/components/auth/ResetPasswordModal';

interface SecuritySettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ isOpen, onClose }) => {
    const { user, resetPassword, changePassword } = useAuth();
    const [activeTab, setActiveTab] = useState<'password' | 'reset'>('password');
    const [loading, setLoading] = useState(false);

    // Change Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Reset Password Form
    const [resetEmail, setResetEmail] = useState(user?.email || '');
    const [resetSent, setResetSent] = useState(false);

    // Reset Password Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetTokens, setResetTokens] = useState<{ access_token?: string, refresh_token?: string }>({});

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

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate passwords match
            if (newPassword !== confirmPassword) {
                throw new Error("New passwords do not match");
            }

            // Validate password strength
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                throw new Error("Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters");
            }

            // Change password using auth context
            await changePassword(currentPassword, newPassword);

            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            toast({
                title: 'Password Changed',
                description: 'Your password has been updated successfully.',
            });

            // Close modal after successful change
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to change password',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!resetEmail) {
                throw new Error("Please enter your email address");
            }

            await resetPassword(resetEmail);

            setResetSent(true);
            toast({
                title: 'Reset Link Sent',
                description: 'Check your email for password reset instructions. Click the link to open the reset popup.',
            });

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send reset email',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle URL params for reset password modal
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (accessToken && refreshToken) {
            setResetTokens({ access_token: accessToken, refresh_token: refreshToken });
            setShowResetModal(true);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const passwordValidation = validatePassword(newPassword);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Shield className="h-5 w-5 mr-2" />
                        Security Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your account security and password settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'password'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Lock className="h-4 w-4 inline mr-2" />
                            Change Password
                        </button>
                        <button
                            onClick={() => setActiveTab('reset')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'reset'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Key className="h-4 w-4 inline mr-2" />
                            Reset Password
                        </button>
                    </div>

                    {/* Change Password Tab */}
                    {activeTab === 'password' && (
                        <div className="space-y-6">
                            <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertDescription>
                                    Change your current password by providing your current password and a new secure password.
                                </AlertDescription>
                            </Alert>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter your current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter your new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>

                                    {/* Password Strength Indicator */}
                                    {newPassword && (
                                        <div className="space-y-2 text-sm">
                                            <p className="text-gray-600">Password requirements:</p>
                                            <div className="space-y-1">
                                                <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {passwordValidation.minLength ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    At least 8 characters
                                                </div>
                                                <div className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {passwordValidation.hasUpperCase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    One uppercase letter
                                                </div>
                                                <div className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {passwordValidation.hasLowerCase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    One lowercase letter
                                                </div>
                                                <div className={`flex items-center ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {passwordValidation.hasNumbers ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    One number
                                                </div>
                                                <div className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                                                    One special character
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-sm text-red-600">Passwords do not match</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
                                >
                                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Change Password
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Reset Password Tab */}
                    {activeTab === 'reset' && (
                        <div className="space-y-6">
                            <Alert>
                                <Key className="h-4 w-4" />
                                <AlertDescription>
                                    Send a password reset link to your email address. This is useful if you've forgotten your current password.
                                </AlertDescription>
                            </Alert>

                            {!resetSent ? (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-email">Email Address</Label>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Send Reset Link
                                    </Button>
                                </form>
                            ) : (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        A password reset link has been sent to <strong>{resetEmail}</strong>.
                                        Please check your email and follow the instructions to reset your password.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <Separator />

                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reset Password Modal */}
            <ResetPasswordModal
                isOpen={showResetModal}
                onClose={() => {
                    setShowResetModal(false);
                    setResetTokens({});
                }}
                accessToken={resetTokens.access_token}
                refreshToken={resetTokens.refresh_token}
            />
        </div>
    );
};
