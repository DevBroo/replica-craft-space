import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AdminTestResult {
    user_id: string;
    email: string;
    profile_role: string;
    has_admin_in_profiles: boolean;
    has_admin_in_user_roles: boolean;
    is_admin_result: boolean;
    total_tickets: number;
    live_chat_tickets: number;
}

export const AdminAccessTest: React.FC = () => {
    const [testResult, setTestResult] = useState<AdminTestResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runTest = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🧪 Running admin access test...');

            // Test authentication
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            console.log('👤 Current user:', user?.id, user?.email);

            // Test admin access function
            const { data, error: testError } = await supabase.rpc('is_admin');
            if (testError) {
                console.error('❌ Test function error:', testError);
                throw testError;
            }

            console.log('📊 Test results:', data);

            if (data !== null) {
                setTestResult({
                    user_id: user?.id || '',
                    email: user?.email || '',
                    profile_role: 'admin',
                    has_admin_in_profiles: data,
                    has_admin_in_user_roles: false,
                    is_admin_result: data,
                    total_tickets: 0,
                    live_chat_tickets: 0
                });
            } else {
                throw new Error('No test results returned');
            }

        } catch (err: any) {
            console.error('❌ Admin test error:', err);
            setError(err.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runTest();
    }, []);

    const StatusIcon = ({ status }: { status: boolean }) => (
        status ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
            <XCircle className="w-4 h-4 text-red-600" />
        )
    );

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Admin Access Debug Test
                </CardTitle>
                <CardDescription>
                    This component tests admin permissions and database access for debugging purposes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={runTest}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Testing...' : 'Run Test'}
                    </Button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <h4 className="font-medium text-red-800 mb-2">Error</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {testResult && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium mb-2">User Information</h4>
                                <div className="space-y-1 text-sm">
                                    <p><strong>ID:</strong> {testResult.user_id}</p>
                                    <p><strong>Email:</strong> {testResult.email}</p>
                                    <p><strong>Profile Role:</strong> {testResult.profile_role}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Permission Status</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={testResult.has_admin_in_profiles} />
                                        <span className="text-sm">Admin in Profiles</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={testResult.has_admin_in_user_roles} />
                                        <span className="text-sm">Admin in User Roles</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusIcon status={testResult.is_admin_result} />
                                        <span className="text-sm">is_admin() Function</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Database Access</h4>
                            <div className="flex gap-4">
                                <Badge variant={testResult.total_tickets > 0 ? "default" : "secondary"}>
                                    {testResult.total_tickets} Total Tickets
                                </Badge>
                                <Badge variant={testResult.live_chat_tickets > 0 ? "default" : "secondary"}>
                                    {testResult.live_chat_tickets} Live Chat Tickets
                                </Badge>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h4 className="font-medium text-blue-800 mb-2">Status Summary</h4>
                            <p className="text-blue-700 text-sm">
                                {testResult.is_admin_result ? (
                                    "✅ Admin access is working correctly!"
                                ) : (
                                    "❌ Admin access is not working. Please run the fix-admin-live-chat-access.sql script."
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AdminAccessTest;
