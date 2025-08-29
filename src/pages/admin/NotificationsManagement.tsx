import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Textarea } from '@/components/admin/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Badge } from '@/components/admin/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/admin/ui/dialog';
import { Label } from '@/components/admin/ui/label';
import { Bell, Plus, Trash2, Edit, Users, AlertTriangle, Info, CheckCircle, Send, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import ComposeNotificationModal from '@/components/admin/ComposeNotificationModal';
import NotificationAnalytics from '@/components/admin/NotificationAnalytics';
import SharedSidebar from '@/components/admin/SharedSidebar';
import SharedHeader from '@/components/admin/SharedHeader';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  target_audience: 'admin' | 'owner' | 'agent' | 'user' | 'all';
  target_user_id?: string;
  created_at: string;
  expires_at?: string;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
  success: CheckCircle
};

const typeColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'success';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    target_audience: 'admin' | 'owner' | 'agent' | 'user' | 'all';
    expires_at: string;
  }>({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    target_audience: 'all',
    expires_at: ''
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as Notification[] || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null
      };

      if (editingNotification) {
        const { error } = await supabase
          .from('notifications')
          .update(payload)
          .eq('id', editingNotification.id);
        
        if (error) throw error;
        toast.success('Notification updated successfully');
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Notification created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      loadNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted successfully');
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      content: notification.content || '',
      type: notification.type,
      priority: notification.priority,
      target_audience: notification.target_audience,
      expires_at: notification.expires_at ? notification.expires_at.split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'normal',
      target_audience: 'all',
      expires_at: ''
    });
    setEditingNotification(null);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.status === 'unread';
    if (activeTab === 'archived') return notification.status === 'archived';
    return notification.type === activeTab;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SharedSidebar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <SharedHeader 
            title="Notifications Management"
            breadcrumb="Admin > Notifications Management"
          />
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Notifications Management"
          breadcrumb="Admin > Notifications Management"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-6 w-6" />
                <h1 className="text-3xl font-bold">Notifications Management</h1>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={() => setIsComposeModalOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Notification
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNotification ? 'Edit Notification' : 'Create New Notification'}
                    </DialogTitle>
                    <DialogDescription>
                      Send notifications to users based on their roles or specific users.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Notification title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Notification content"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
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
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
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
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Select value={formData.target_audience} onValueChange={(value: any) => setFormData({ ...formData, target_audience: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                          <SelectItem value="owner">Property Owners</SelectItem>
                          <SelectItem value="agent">Agents</SelectItem>
                          <SelectItem value="user">Regular Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires_at">Expires At (Optional)</Label>
                      <Input
                        id="expires_at"
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingNotification ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <ComposeNotificationModal
              isOpen={isComposeModalOpen}
              onClose={() => setIsComposeModalOpen(false)}
              onSent={loadNotifications}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="space-y-4">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="warning">Warning</TabsTrigger>
                    <TabsTrigger value="error">Error</TabsTrigger>
                    <TabsTrigger value="success">Success</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                      <Card>
                        <CardContent className="flex items-center justify-center h-40">
                          <p className="text-muted-foreground">No notifications found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredNotifications.map((notification) => {
                        const TypeIcon = typeIcons[notification.type];
                        return (
                          <Card key={notification.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <TypeIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                                    {notification.content && (
                                      <CardDescription className="mt-1">
                                        {notification.content}
                                      </CardDescription>
                                    )}
                                    <div className="flex items-center space-x-2 mt-3">
                                      <Badge className={typeColors[notification.type]}>
                                        {notification.type}
                                      </Badge>
                                      <Badge className={priorityColors[notification.priority]}>
                                        {notification.priority}
                                      </Badge>
                                      <Badge variant="outline">
                                        <Users className="h-3 w-3 mr-1" />
                                        {notification.target_audience}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(notification)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notification.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="analytics">
                <NotificationAnalytics />
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}