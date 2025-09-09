import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Switch } from '@/components/admin/ui/switch';
import { Label } from '@/components/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Badge } from '@/components/admin/ui/badge';
import { Separator } from '@/components/admin/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, MessageSquare, Bell, Settings, Shield, CreditCard, Calendar } from 'lucide-react';

interface NotificationPreference {
    id?: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    category: string;
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

interface PreferenceCategory {
    key: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    defaultEnabled: {
        email: boolean;
        sms: boolean;
        push: boolean;
        in_app: boolean;
    };
}

const NOTIFICATION_CATEGORIES: PreferenceCategory[] = [
    {
        key: 'booking',
        name: 'Booking Updates',
        description: 'New bookings, confirmations, and cancellations',
        icon: <Calendar className="h-5 w-5" />,
        defaultEnabled: { email: true, sms: false, push: true, in_app: true }
    },
    {
        key: 'payment',
        name: 'Payment Notifications',
        description: 'Payment confirmations, refunds, and billing updates',
        icon: <CreditCard className="h-5 w-5" />,
        defaultEnabled: { email: true, sms: false, push: true, in_app: true }
    },
    {
        key: 'security',
        name: 'Security Alerts',
        description: 'Login alerts, password changes, and security updates',
        icon: <Shield className="h-5 w-5" />,
        defaultEnabled: { email: true, sms: true, push: true, in_app: true }
    },
    {
        key: 'system',
        name: 'System Updates',
        description: 'App updates, maintenance notices, and announcements',
        icon: <Bell className="h-5 w-5" />,
        defaultEnabled: { email: false, sms: false, push: true, in_app: true }
    },
    {
        key: 'marketing',
        name: 'Marketing & Promotions',
        description: 'Special offers, newsletters, and promotional content',
        icon: <Mail className="h-5 w-5" />,
        defaultEnabled: { email: false, sms: false, push: false, in_app: false }
    }
];

export const NotificationPreferences: React.FC = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadPreferences();
        }
    }, [user?.id]);

    const loadPreferences = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_notification_preferences')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Convert to preference map
            const preferenceMap: Record<string, NotificationPreference> = {};

            // Initialize with defaults for all categories and channels
            NOTIFICATION_CATEGORIES.forEach(category => {
                ['email', 'sms', 'push', 'in_app'].forEach(channel => {
                    const key = `${category.key}-${channel}`;
                    preferenceMap[key] = {
                        channel: channel as any,
                        category: category.key,
                        enabled: category.defaultEnabled[channel as keyof typeof category.defaultEnabled],
                        frequency: 'immediate'
                    };
                });
            });

            // Override with saved preferences
            data?.forEach(pref => {
                const key = `${pref.category}-${pref.channel}`;
                preferenceMap[key] = {
                    id: pref.id,
                    channel: pref.channel,
                    category: pref.category,
                    enabled: pref.enabled,
                    frequency: pref.frequency
                };
            });

            setPreferences(preferenceMap);
        } catch (error) {
            console.error('Error loading preferences:', error);
            toast.error('Failed to load notification preferences');
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = (category: string, channel: string, field: keyof NotificationPreference, value: any) => {
        const key = `${category}-${channel}`;
        setPreferences(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const savePreferences = async () => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const preferencesToSave = Object.values(preferences).map(pref => ({
                id: pref.id,
                user_id: user.id,
                channel: pref.channel,
                category: pref.category,
                enabled: pref.enabled,
                frequency: pref.frequency
            }));

            const { error } = await supabase
                .from('user_notification_preferences')
                .upsert(preferencesToSave, {
                    onConflict: 'user_id,channel,category',
                    ignoreDuplicates: false
                });

            if (error) throw error;

            toast.success('Notification preferences saved successfully');
            await loadPreferences(); // Reload to get IDs for new records
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save notification preferences');
        } finally {
            setSaving(false);
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail className="h-4 w-4 text-green-600" />;
            case 'sms': return <MessageSquare className="h-4 w-4 text-orange-600" />;
            case 'push': return <Bell className="h-4 w-4 text-blue-600" />;
            case 'in_app': return <Bell className="h-4 w-4 text-purple-600" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    const getChannelLabel = (channel: string) => {
        switch (channel) {
            case 'email': return 'Email';
            case 'sms': return 'SMS';
            case 'push': return 'Push';
            case 'in_app': return 'In-App';
            default: return channel;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Control how and when you receive notifications. You can enable or disable notifications for different channels and categories.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {NOTIFICATION_CATEGORIES.map((category) => (
                        <div key={category.key} className="space-y-4">
                            <div className="flex items-center gap-3">
                                {category.icon}
                                <div>
                                    <h4 className="font-medium">{category.name}</h4>
                                    <p className="text-sm text-muted-foreground">{category.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-8">
                                {['email', 'sms', 'push', 'in_app'].map((channel) => {
                                    const key = `${category.key}-${channel}`;
                                    const pref = preferences[key] || {
                                        channel: channel as any,
                                        category: category.key,
                                        enabled: false,
                                        frequency: 'immediate'
                                    };

                                    return (
                                        <div key={channel} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getChannelIcon(channel)}
                                                    <Label className="text-sm font-medium">
                                                        {getChannelLabel(channel)}
                                                    </Label>
                                                </div>
                                                <Switch
                                                    checked={pref.enabled}
                                                    onCheckedChange={(checked) =>
                                                        updatePreference(category.key, channel, 'enabled', checked)
                                                    }
                                                />
                                            </div>

                                            {pref.enabled && channel !== 'in_app' && (
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Frequency</Label>
                                                    <Select
                                                        value={pref.frequency}
                                                        onValueChange={(value) =>
                                                            updatePreference(category.key, channel, 'frequency', value)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="immediate">Immediate</SelectItem>
                                                            <SelectItem value="daily">Daily</SelectItem>
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="never">Never</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {channel === 'in_app' && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Always immediate
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {category.key !== NOTIFICATION_CATEGORIES[NOTIFICATION_CATEGORIES.length - 1].key && (
                                <Separator className="mt-6" />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-end pt-4">
                        <Button onClick={savePreferences} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Preferences'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Important Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• <strong>Security alerts</strong> are recommended to be enabled for all channels for your account safety</p>
                    <p>• <strong>In-app notifications</strong> are always delivered immediately and cannot be disabled</p>
                    <p>• <strong>SMS notifications</strong> may incur charges from your mobile carrier</p>
                    <p>• You can change these preferences at any time</p>
                </CardContent>
            </Card>
        </div>
    );
};



