import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Textarea } from '@/components/admin/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Label } from '@/components/admin/ui/label';
import { Checkbox } from '@/components/admin/ui/checkbox';
import { Badge } from '@/components/admin/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Send, Users, Mail, MessageSquare, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ComposeNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

interface RecipientGroup {
  type: 'user' | 'agent' | 'owner';
  count: number;
  label: string;
}

export default function ComposeNotificationModal({ isOpen, onClose, onSent }: ComposeNotificationModalProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMode, setSendingMode] = useState<'now' | 'scheduled'>('now');

  const [formData, setFormData] = useState({
    recipients: {
      user: false,
      agent: false,
      owner: false,
    },
    delivery_methods: {
      email: true,
      sms: false,
      in_app: true,
    },
    subject: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    scheduled_for: '',
    variables: {} as Record<string, string>,
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadRecipientCounts();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const loadRecipientCounts = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role')
        .neq('role', 'admin');

      if (error) throw error;

      const counts = (profiles || []).reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setRecipientGroups([
        { type: 'user', count: counts.user || 0, label: 'Regular Users' },
        { type: 'agent', count: counts.agent || 0, label: 'Agents' },
        { type: 'owner', count: counts.property_owner || 0, label: 'Hosts' },
      ]);
    } catch (error) {
      console.error('Error loading recipient counts:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.content) {
      toast.error('Please fill in subject and content');
      return;
    }

    const selectedRecipients = Object.entries(formData.recipients)
      .filter(([_, selected]) => selected)
      .map(([type]) => type);

    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient group');
      return;
    }

    const selectedMethods = Object.entries(formData.delivery_methods)
      .filter(([_, selected]) => selected)
      .map(([method]) => method);

    if (selectedMethods.length === 0) {
      toast.error('Please select at least one delivery method');
      return;
    }

    setLoading(true);

    try {
      // Prepare recipients list with preference filtering
      const recipients = [];
      for (const type of selectedRecipients) {
        const roleMapping = {
          user: 'user',
          agent: 'agent',
          owner: 'property_owner'
        };

        // Get all users of this role
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, phone, full_name')
          .eq('role', roleMapping[type as keyof typeof roleMapping]);

        if (profiles) {
          // For each profile, check their notification preferences for selected delivery methods
          for (const profile of profiles) {
            const recipient = {
              type: type as 'user' | 'agent' | 'owner',
              id: profile.id,
              email: profile.email,
              phone: profile.phone,
              name: profile.full_name || 'User'
            };

            // Check user preferences for email and SMS (in-app is always allowed)
            if (selectedMethods.includes('email') || selectedMethods.includes('sms')) {
              const { data: preferences } = await supabase
                .from('user_notification_preferences')
                .select('channel, enabled')
                .eq('user_id', profile.id)
                .in('channel', selectedMethods.filter(m => m !== 'in_app'));

              // Create preference map
              const preferenceMap = preferences?.reduce((acc, pref) => {
                acc[pref.channel] = pref.enabled;
                return acc;
              }, {} as Record<string, boolean>) || {};

              // If user hasn't set preferences, default to enabled for email, disabled for SMS
              recipient.email_allowed = preferenceMap.email !== false; // Default true
              recipient.sms_allowed = preferenceMap.sms === true; // Default false
            } else {
              recipient.email_allowed = true;
              recipient.sms_allowed = true;
            }

            recipients.push(recipient);
          }
        }
      }

      // Call notification dispatch edge function
      const { data, error } = await supabase.functions.invoke('notifications-dispatch', {
        body: {
          recipients,
          delivery_methods: selectedMethods,
          template_id: selectedTemplate || undefined,
          subject: formData.subject,
          content: formData.content,
          priority: formData.priority,
          type: formData.type,
          variables: formData.variables,
          scheduled_for: sendingMode === 'scheduled' ? formData.scheduled_for : undefined,
        },
      });

      if (error) throw error;

      toast.success(`Notification ${sendingMode === 'scheduled' ? 'scheduled' : 'sent'} successfully! ${data.success_count} delivered, ${data.failure_count} failed.`);
      onClose();
      resetForm();
      onSent?.();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipients: { user: false, agent: false, owner: false },
      delivery_methods: { email: true, sms: false, in_app: true },
      subject: '',
      content: '',
      priority: 'normal',
      type: 'info',
      scheduled_for: '',
      variables: {},
    });
    setSelectedTemplate('');
    setSendingMode('now');
  };

  const getTotalRecipients = () => {
    return recipientGroups
      .filter(group => formData.recipients[group.type])
      .reduce((total, group) => total + group.count, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Notification
          </DialogTitle>
          <DialogDescription>
            Send notifications to users via email, SMS, or in-app messages
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="recipients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recipients ({getTotalRecipients()})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Delivery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Subject & Content */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter notification subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter notification content"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Use variables like {'{customer_name}'}, {'{property_title}'}, etc. for personalization
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Recipient Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipientGroups.map((group) => (
                  <div key={group.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.recipients[group.type]}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            recipients: { ...prev.recipients, [group.type]: checked }
                          }))
                        }
                      />
                      <div>
                        <Label className="font-medium">{group.label}</Label>
                        <p className="text-sm text-muted-foreground">{group.count} users</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{group.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Methods</CardTitle>
                <CardDescription>
                  Choose how to deliver notifications. Users can opt-out of email/SMS in their preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.delivery_methods.in_app}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            delivery_methods: { ...prev.delivery_methods, in_app: !!checked }
                          }))
                        }
                      />
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <Label className="font-medium">In-App Notification</Label>
                      </div>
                    </div>
                    <Badge variant="secondary">Always available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.delivery_methods.email}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            delivery_methods: { ...prev.delivery_methods, email: !!checked }
                          }))
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-green-500" />
                        <Label className="font-medium">Email Notification</Label>
                      </div>
                    </div>
                    <Badge variant="outline">Respects user preferences</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={formData.delivery_methods.sms}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({
                            ...prev,
                            delivery_methods: { ...prev.delivery_methods, sms: !!checked }
                          }))
                        }
                      />
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        <Label className="font-medium">SMS Notification</Label>
                      </div>
                    </div>
                    <Badge variant="outline">Respects user preferences</Badge>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Email and SMS notifications will only be sent to users who have opted-in to receive them in their notification preferences. In-app notifications are always delivered.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendingMode === 'now'}
                      onCheckedChange={() => setSendingMode('now')}
                    />
                    <Label>Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendingMode === 'scheduled'}
                      onCheckedChange={() => setSendingMode('scheduled')}
                    />
                    <Label>Schedule for Later</Label>
                  </div>
                </div>

                {sendingMode === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Schedule Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduled_for}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {getTotalRecipients() > 0 && (
              <span>Will send to {getTotalRecipients()} recipients</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading}>
              {loading ? 'Sending...' : sendingMode === 'scheduled' ? 'Schedule' : 'Send Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}