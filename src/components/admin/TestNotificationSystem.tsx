import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Textarea } from '@/components/admin/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Label } from '@/components/admin/ui/label';
import { Checkbox } from '@/components/admin/ui/checkbox';
import { Badge } from '@/components/admin/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, TestTube, Mail, MessageSquare, Bell, AlertCircle } from 'lucide-react';

export const TestNotificationSystem: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [testForm, setTestForm] = useState({
        testEmail: '',
        testPhone: '',
        testMessage: 'This is a test notification from Picnify admin panel.',
        testSubject: 'Test Notification',
        deliveryMethods: {
            email: true,
            sms: false,
            'in-app': true,
        }
    });

    const [testResults, setTestResults] = useState<any>(null);

    const runNotificationTest = async () => {
        if (!testForm.testEmail) {
            toast.error('Please enter a test email address');
            return;
        }

        setLoading(true);
        setTestResults(null);

        try {
            const selectedMethods = Object.entries(testForm.deliveryMethods)
                .filter(([_, selected]) => selected)
                .map(([method]) => method);

            if (selectedMethods.length === 0) {
                toast.error('Please select at least one delivery method');
                return;
            }

            // Create test recipient - for testing, we don't need a real user ID
            const testRecipient = {
                type: 'user' as const,
                id: undefined, // No user ID for simple testing
                email: testForm.testEmail,
                phone: testForm.testPhone || undefined,
                name: 'Test User'
            };

            console.log('🧪 Testing notification system...');
            console.log('📧 Recipient:', testRecipient);
            console.log('📋 Methods:', selectedMethods);

            // Call the notification dispatch function
            const { data, error } = await supabase.functions.invoke('notifications-dispatch', {
                body: {
                    recipients: [testRecipient],
                    delivery_methods: selectedMethods,
                    subject: testForm.testSubject,
                    content: testForm.testMessage,
                    priority: 'normal',
                    type: 'info',
                    variables: {
                        customer_name: 'Test User',
                        test_mode: 'true'
                    },
                    test_mode: true // Add test mode flag
                },
            });

            if (error) throw error;

            setTestResults(data);

            if (data.success_count > 0) {
                toast.success(`Test completed! ${data.success_count} notifications sent successfully`);
            } else {
                toast.warning(`Test completed with issues. ${data.failure_count} failures detected`);
            }

        } catch (error) {
            console.error('❌ Test failed:', error);
            toast.error('Test failed: ' + (error as Error).message);
            setTestResults({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const checkServiceStatus = async () => {
        try {
            toast.info('Checking notification service status...');

            // Test basic connectivity
            const { data, error } = await supabase.functions.invoke('notifications-dispatch', {
                body: {
                    recipients: [],
                    delivery_methods: ['in-app'],
                    subject: 'Health Check',
                    content: 'System health check',
                    test_mode: true
                },
            });

            if (error) {
                toast.error('Service check failed: ' + error.message);
            } else {
                toast.success('✅ Notification service is running');
            }
        } catch (error) {
            toast.error('Service check failed: ' + (error as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        Test Notification System
                    </CardTitle>
                    <CardDescription>
                        Test email, SMS, and in-app notifications to verify the system is working correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Service Status */}
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={checkServiceStatus}>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Check Service Status
                        </Button>
                        <Badge variant="outline">
                            Resend API: Configured
                        </Badge>
                        <Badge variant="outline">
                            Twilio SMS: Configured
                        </Badge>
                    </div>

                    {/* Test Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="test-email">Test Email Address *</Label>
                                <Input
                                    id="test-email"
                                    type="email"
                                    value={testForm.testEmail}
                                    onChange={(e) => setTestForm(prev => ({ ...prev, testEmail: e.target.value }))}
                                    placeholder="test@example.com"
                                />
                            </div>

                            <div>
                                <Label htmlFor="test-phone">Test Phone Number (for SMS)</Label>
                                <Input
                                    id="test-phone"
                                    type="tel"
                                    value={testForm.testPhone}
                                    onChange={(e) => setTestForm(prev => ({ ...prev, testPhone: e.target.value }))}
                                    placeholder="+1234567890"
                                />
                            </div>

                            <div>
                                <Label htmlFor="test-subject">Subject</Label>
                                <Input
                                    id="test-subject"
                                    value={testForm.testSubject}
                                    onChange={(e) => setTestForm(prev => ({ ...prev, testSubject: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Delivery Methods</Label>
                                <div className="space-y-3 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={testForm.deliveryMethods.email}
                                            onCheckedChange={(checked) =>
                                                setTestForm(prev => ({
                                                    ...prev,
                                                    deliveryMethods: { ...prev.deliveryMethods, email: !!checked }
                                                }))
                                            }
                                        />
                                        <Mail className="h-4 w-4 text-green-600" />
                                        <Label>Email (via Resend)</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={testForm.deliveryMethods.sms}
                                            onCheckedChange={(checked) =>
                                                setTestForm(prev => ({
                                                    ...prev,
                                                    deliveryMethods: { ...prev.deliveryMethods, sms: !!checked }
                                                }))
                                            }
                                        />
                                        <MessageSquare className="h-4 w-4 text-orange-600" />
                                        <Label>SMS (via Twilio)</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={testForm.deliveryMethods['in-app']}
                                            onCheckedChange={(checked) =>
                                                setTestForm(prev => ({
                                                    ...prev,
                                                    deliveryMethods: { ...prev.deliveryMethods, 'in-app': !!checked }
                                                }))
                                            }
                                        />
                                        <Bell className="h-4 w-4 text-blue-600" />
                                        <Label>In-App</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="test-message">Test Message</Label>
                        <Textarea
                            id="test-message"
                            value={testForm.testMessage}
                            onChange={(e) => setTestForm(prev => ({ ...prev, testMessage: e.target.value }))}
                            rows={4}
                        />
                    </div>

                    <Button onClick={runNotificationTest} disabled={loading} className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        {loading ? 'Sending Test...' : 'Send Test Notification'}
                    </Button>

                    {/* Test Results */}
                    {testResults && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Test Results</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {testResults.error ? (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-800 font-medium">Test Failed</p>
                                        <p className="text-red-600 text-sm mt-1">{testResults.error}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Notifications Sent:</span>
                                            <Badge variant="default">{testResults.success_count}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Failures:</span>
                                            <Badge variant={testResults.failure_count > 0 ? "destructive" : "secondary"}>
                                                {testResults.failure_count}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Notification ID:</span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {testResults.notification_id?.slice(-8)}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Testing Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>• Use your own email address to test email delivery</p>
                    <p>• SMS testing requires a valid phone number and may incur charges</p>
                    <p>• In-app notifications are stored in the database and can be viewed in the admin panel</p>
                    <p>• Check your email spam folder if you don't receive the test email</p>
                    <p>• Test results will show delivery status for each method</p>
                </CardContent>
            </Card>
        </div>
    );
};
