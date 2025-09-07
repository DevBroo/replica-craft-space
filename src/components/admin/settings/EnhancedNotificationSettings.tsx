import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Badge } from '@/components/admin/ui/badge';
import { Textarea } from '@/components/admin/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MessageSquare, Bell, Users, Calendar, BarChart3, Settings2, Plus, Edit, Trash2 } from 'lucide-react';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  config: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: string;
  category: string;
  variables: string[];
  is_active: boolean;
}

interface ScheduledNotification {
  id: string;
  template_id: string;
  scheduled_for: string;
  recipients: any[];
  delivery_methods: string[];
  status: string;
  template_name: string;
}

export const EnhancedNotificationSettings: React.FC = () => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [schedules, setSchedules] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');

  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Scheduling state
  const [schedulingTemplate, setSchedulingTemplate] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'users' | 'agents' | 'owners'>('all');

  useEffect(() => {
    loadChannels();
    loadTemplates();
    loadSchedules();
  }, []);

  const loadChannels = async () => {
    console.log('📡 Loading notification channels...');
    setLoading(true);
    try {
      // Mock channels for now - in real implementation, load from API integrations
      const mockChannels: NotificationChannel[] = [
        {
          id: '1',
          name: 'Email (Resend)',
          type: 'email',
          enabled: true,
          config: { provider: 'resend', from_email: 'notifications@picnify.com' }
        },
        {
          id: '2',
          name: 'SMS (Twilio)',
          type: 'sms',
          enabled: false,
          config: { provider: 'twilio', from_number: '+1234567890' }
        },
        {
          id: '3',
          name: 'Push Notifications',
          type: 'push',
          enabled: false,
          config: { provider: 'firebase', app_id: 'picnify-app' }
        },
        {
          id: '4',
          name: 'In-App Notifications',
          type: 'in_app',
          enabled: true,
          config: {}
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      console.error('❌ Error loading channels:', error);
      toast({
        title: "Error",
        description: "Failed to load notification channels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    console.log('📝 Loading notification templates...');
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('name');

      if (error) throw error;

      const templatesWithVariables = data?.map(template => ({
        ...template,
        variables: (template as any).variables || []
      })) || [];

      setTemplates(templatesWithVariables);
      console.log('✅ Loaded templates:', templatesWithVariables.length);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load notification templates",
        variant: "destructive"
      });
    }
  };

  const loadSchedules = async () => {
    console.log('📅 Loading scheduled notifications...');
    try {
      // Mock schedules for now
      const mockSchedules: ScheduledNotification[] = [
        {
          id: '1',
          template_id: '1',
          template_name: 'Weekly Report',
          scheduled_for: '2024-01-15T09:00:00Z',
          recipients: [{ type: 'admin' }],
          delivery_methods: ['email'],
          status: 'pending'
        }
      ];
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('❌ Error loading schedules:', error);
    }
  };

  const toggleChannel = async (channelId: string) => {
    console.log('🔄 Toggling channel:', channelId);
    try {
      setChannels(prev => prev.map(channel =>
        channel.id === channelId
          ? { ...channel, enabled: !channel.enabled }
          : channel
      ));
      
      toast({
        title: "Success",
        description: "Channel status updated",
      });
    } catch (error) {
      console.error('❌ Error toggling channel:', error);
      toast({
        title: "Error",
        description: "Failed to update channel status",
        variant: "destructive"
      });
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    
    console.log('💾 Saving template:', editingTemplate.name);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notification_templates')
        .upsert({
          id: editingTemplate.id === 'new' ? undefined : editingTemplate.id,
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          content: editingTemplate.content,
          type: editingTemplate.type,
          category: editingTemplate.category,
          variables: editingTemplate.variables,
          is_active: editingTemplate.is_active
        });

      if (error) throw error;

      await loadTemplates();
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
    } catch (error) {
      console.error('❌ Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async () => {
    if (!schedulingTemplate || !scheduleDate || !scheduleTime) {
      toast({
        title: "Error",
        description: "Please fill in all scheduling fields",
        variant: "destructive"
      });
      return;
    }

    console.log('📅 Scheduling notification...');
    setLoading(true);
    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      
      // Mock scheduling - in real implementation, save to notification_schedules
      toast({
        title: "Success",
        description: "Notification scheduled successfully",
      });
      
      // Reset form
      setSchedulingTemplate('');
      setScheduleDate('');
      setScheduleTime('');
      setRecipientType('all');
      
      await loadSchedules();
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      toast({
        title: "Error",
        description: "Failed to schedule notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h2 className="text-lg font-medium">Enhanced Notification Settings</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Configure different notification delivery methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {channel.type === 'email' && <Mail className="h-5 w-5" />}
                    {channel.type === 'sms' && <MessageSquare className="h-5 w-5" />}
                    {channel.type === 'push' && <Bell className="h-5 w-5" />}
                    {channel.type === 'in_app' && <Users className="h-5 w-5" />}
                    <div>
                      <h4 className="font-medium">{channel.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Provider: {channel.config.provider || 'Built-in'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={channel.enabled ? 'default' : 'secondary'}>
                      {channel.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                  Manage reusable notification templates
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingTemplate({
                    id: 'new',
                    name: '',
                    subject: '',
                    content: '',
                    type: 'email',
                    category: 'general',
                    variables: [],
                    is_active: true
                  });
                  setIsTemplateModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsTemplateModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            try {
                              const { error } = await supabase
                                .from('notification_templates')
                                .delete()
                                .eq('id', template.id);
                              
                              if (error) throw error;
                              await loadTemplates();
                              toast({ title: "Success", description: "Template deleted" });
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Notifications</CardTitle>
              <CardDescription>
                Schedule notifications to be sent at specific times
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-select">Template</Label>
                  <Select value={schedulingTemplate} onValueChange={setSchedulingTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.is_active).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipient-type">Recipients</Label>
                  <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="users">Customers Only</SelectItem>
                      <SelectItem value="agents">Agents Only</SelectItem>
                      <SelectItem value="owners">Hosts Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={scheduleNotification} 
                disabled={loading || !schedulingTemplate || !scheduleDate || !scheduleTime}
              >
                Schedule Notification
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{schedule.template_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Scheduled for: {new Date(schedule.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={schedule.status === 'pending' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No scheduled notifications
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">-5 from last month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Analytics</CardTitle>
              <CardDescription>
                Track notification performance and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed analytics coming soon</p>
                <p className="text-xs">Track opens, clicks, bounces, and more</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Modal */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTemplate.id === 'new' ? 'Create Template' : 'Edit Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </div>
              <div>
                <Label htmlFor="template-subject">Subject</Label>
                <Input
                  id="template-subject"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate(prev => prev ? {...prev, subject: e.target.value} : null)}
                />
              </div>
              <div>
                <Label htmlFor="template-content">Content</Label>
                <Textarea
                  id="template-content"
                  rows={8}
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? {...prev, content: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={editingTemplate.category} 
                    onValueChange={(value) => setEditingTemplate(prev => prev ? {...prev, category: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingTemplate.is_active}
                    onCheckedChange={(checked) => setEditingTemplate(prev => prev ? {...prev, is_active: checked} : null)}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsTemplateModalOpen(false);
                    setEditingTemplate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={loading}>
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};