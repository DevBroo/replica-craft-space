import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// This page handles the reset password modal redirect
const AuthResetPasswordModal = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            // Create a custom event to trigger the modal
            const resetEvent = new CustomEvent('passwordReset', {
                detail: {
                    access_token: accessToken,
                    refresh_token: refreshToken
                }
            });

            window.dispatchEvent(resetEvent);

            // Close this window/tab or redirect to main app
            window.close();

            // If window.close() doesn't work (popup blocker), redirect to main page
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Opening Reset Password...
                </h2>
                <p className="text-gray-600 mb-4">
                    Please wait while we prepare your password reset form.
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        </div>
    );
};

export default AuthResetPasswordModal;


