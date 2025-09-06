import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreference {
    id?: string;
    user_id: string;
    channel: 'email';
    category: 'booking' | 'payment' | 'security' | 'marketing' | 'updates';
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

interface EmailNotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const NOTIFICATION_CATEGORIES = [
    {
        key: 'booking' as const,
        label: 'Booking Updates',
        description: 'Confirmations, modifications, and reminders about your bookings'
    },
    {
        key: 'payment' as const,
        label: 'Payment Notifications',
        description: 'Payment receipts, refunds, and billing updates'
    },
    {
        key: 'security' as const,
        label: 'Security Alerts',
        description: 'Account security, login attempts, and password changes'
    },
    {
        key: 'marketing' as const,
        label: 'Promotions & Offers',
        description: 'Special deals, discounts, and marketing communications'
    },
    {
        key: 'updates' as const,
        label: 'Product Updates',
        description: 'New features, maintenance notifications, and platform news'
    }
];

const CHANNELS = [
    { key: 'email' as const, label: 'Email', icon: Mail }
];

const FREQUENCIES = [
    { key: 'immediate' as const, label: 'Immediately' },
    { key: 'daily' as const, label: 'Daily Digest' },
    { key: 'weekly' as const, label: 'Weekly Summary' },
    { key: 'never' as const, label: 'Never' }
];

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadPreferences();
        }
    }, [isOpen, user]);

    const loadPreferences = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_notification_preferences')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Create default preferences if none exist
            if (!data || data.length === 0) {
                const defaultPreferences = createDefaultPreferences();
                setPreferences(defaultPreferences);
                await saveDefaultPreferences(defaultPreferences);
            } else {
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            toast({
                title: 'Error',
                description: 'Failed to load notification preferences',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const createDefaultPreferences = (): NotificationPreference[] => {
        const defaults: NotificationPreference[] = [];

        NOTIFICATION_CATEGORIES.forEach(category => {
            CHANNELS.forEach(channel => {
                // Set sensible defaults
                let enabled = true;
                let frequency: 'immediate' | 'daily' | 'weekly' | 'never' = 'immediate';

                // Marketing defaults to weekly, security to immediate
                if (category.key === 'marketing') {
                    frequency = 'weekly';
                    enabled = false; // Opt-in for marketing
                } else if (category.key === 'security') {
                    frequency = 'immediate';
                }

                // Email notifications enabled by default for all categories except marketing

                defaults.push({
                    user_id: user!.id,
                    channel: channel.key,
                    category: category.key,
                    enabled,
                    frequency
                });
            });
        });

        return defaults;
    };

    const saveDefaultPreferences = async (defaultPreferences: NotificationPreference[]) => {
        try {
            const { error } = await supabase
                .from('user_notification_preferences')
                .insert(defaultPreferences);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving default preferences:', error);
        }
    };

    const updatePreference = async (category: string, channel: string, field: 'enabled' | 'frequency', value: boolean | string) => {
        if (!user) return;

        setSaving(true);
        try {
            const existingPref = preferences.find(p => p.category === category && p.channel === channel);

            if (existingPref && existingPref.id) {
                // Update existing preference
                const { error } = await supabase
                    .from('user_notification_preferences')
                    .update({ [field]: value, updated_at: new Date().toISOString() })
                    .eq('id', existingPref.id);

                if (error) throw error;
            } else {
                // Create new preference
                const newPref = {
                    user_id: user.id,
                    channel,
                    category,
                    enabled: field === 'enabled' ? value : true,
                    frequency: field === 'frequency' ? value : 'immediate'
                };

                const { error } = await supabase
                    .from('user_notification_preferences')
                    .insert(newPref);

                if (error) throw error;
            }

            // Update local state
            setPreferences(prev => {
                const updated = [...prev];
                const index = updated.findIndex(p => p.category === category && p.channel === channel);
                if (index >= 0) {
                    updated[index] = { ...updated[index], [field]: value };
                } else {
                    updated.push({
                        user_id: user.id,
                        channel: channel as any,
                        category: category as any,
                        enabled: field === 'enabled' ? value as boolean : true,
                        frequency: field === 'frequency' ? value as any : 'immediate'
                    });
                }
                return updated;
            });

            // Subscribe to Twilio notification service when email notifications are enabled
            if (field === 'enabled' && value === true) {
                await subscribeToTwilioEmailService(category);
            }

            toast({
                title: 'Settings Updated',
                description: 'Your notification preferences have been saved successfully.',
            });

        } catch (error) {
            console.error('Error updating preference:', error);
            toast({
                title: 'Error',
                description: 'Failed to update notification preferences',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const subscribeToTwilioEmailService = async (category: string) => {
        try {
            // Call the existing notifications dispatch function to set up email subscription via Twilio
            const { data, error } = await supabase.functions.invoke('notifications-dispatch', {
                body: {
                    action: 'subscribe',
                    user_id: user!.id,
                    channel: 'email',
                    category: category
                }
            });

            if (error) {
                console.error('Error subscribing to Twilio email service:', error);
            } else {
                console.log('Successfully subscribed to Twilio email notifications for:', category);
            }
        } catch (error) {
            console.error('Error calling Twilio subscription service:', error);
        }
    };

    const getPreference = (category: string, channel: string) => {
        return preferences.find(p => p.category === category && p.channel === channel);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Mail className="h-5 w-5 mr-2" />
                        Email Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your email notification preferences. All notifications are sent via Twilio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {NOTIFICATION_CATEGORIES.map((category) => (
                                <Card key={category.key} className="border border-gray-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">{category.label}</CardTitle>
                                        <CardDescription>{category.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {CHANNELS.map((channel) => {
                                            const IconComponent = channel.icon;
                                            const pref = getPreference(category.key, channel.key);

                                            return (
                                                <div key={channel.key} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                                    <div className="flex items-center space-x-3">
                                                        <IconComponent className="h-5 w-5 text-blue-600" />
                                                        <div>
                                                            <Label className="text-base font-medium">Email Notifications</Label>
                                                            <p className="text-sm text-gray-600 mt-1">Powered by Twilio</p>
                                                            <div className="flex items-center space-x-4 mt-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Switch
                                                                        checked={pref?.enabled || false}
                                                                        onCheckedChange={(checked) =>
                                                                            updatePreference(category.key, channel.key, 'enabled', checked)
                                                                        }
                                                                        disabled={saving}
                                                                    />
                                                                    <span className="text-sm text-gray-600">
                                                                        {pref?.enabled ? 'Enabled' : 'Disabled'}
                                                                    </span>
                                                                </div>
                                                                {pref?.enabled && (
                                                                    <Select
                                                                        value={pref?.frequency || 'immediate'}
                                                                        onValueChange={(value) =>
                                                                            updatePreference(category.key, channel.key, 'frequency', value)
                                                                        }
                                                                        disabled={saving}
                                                                    >
                                                                        <SelectTrigger className="w-36 h-8">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {FREQUENCIES.map((freq) => (
                                                                                <SelectItem key={freq.key} value={freq.key}>
                                                                                    {freq.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <Separator />

                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={onClose} disabled={saving}>
                            Close
                        </Button>
                        <Button onClick={onClose} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Done
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
