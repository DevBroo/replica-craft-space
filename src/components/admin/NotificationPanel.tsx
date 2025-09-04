import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NotificationService } from '@/lib/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Send, Users, UserCheck, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const NotificationPanel: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target: 'property_owners' as 'property_owners' | 'all_users' | 'specific_role',
    role: '',
    action_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let result;

      switch (formData.target) {
        case 'property_owners':
          result = await NotificationService.notifyPropertyOwners(
            formData.title,
            formData.message,
            user?.id,
            formData.type,
            formData.action_url || undefined
          );
          break;
        case 'all_users':
          result = await NotificationService.notifyAllUsers(
            formData.title,
            formData.message,
            user?.id,
            formData.type,
            formData.action_url || undefined
          );
          break;
        case 'specific_role':
          if (!formData.role) {
            toast.error('Please select a role');
            setLoading(false);
            return;
          }
          result = await NotificationService.notifyByRole(
            formData.title,
            formData.message,
            formData.role,
            user?.id,
            formData.type,
            formData.action_url || undefined
          );
          break;
        default:
          toast.error('Invalid target selection');
          setLoading(false);
          return;
      }

      if (result.success) {
        toast.success(`Notification sent successfully to ${result.sent_count} users`);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          target: 'property_owners',
          role: '',
          action_url: ''
        });
      } else {
        toast.error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send Notification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title"
                required
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message"
                rows={4}
                required
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('info')}
                      <span>Info</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('success')}
                      <span>Success</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('warning')}
                      <span>Warning</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon('error')}
                      <span>Error</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target */}
            <div>
              <Label htmlFor="target">Send To</Label>
              <Select
                value={formData.target}
                onValueChange={(value: 'property_owners' | 'all_users' | 'specific_role') => 
                  setFormData(prev => ({ ...prev, target: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_owners">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Property Owners</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="all_users">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>All Users</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific_role">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Specific Role</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Selection (if specific role is selected) */}
            {formData.target === 'specific_role' && (
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="property_owner">Property Owner</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action URL */}
            <div>
              <Label htmlFor="action_url">Action URL (Optional)</Label>
              <Input
                id="action_url"
                value={formData.action_url}
                onChange={(e) => setFormData(prev => ({ ...prev, action_url: e.target.value }))}
                placeholder="https://example.com"
                type="url"
              />
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getTypeIcon(formData.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {formData.title || 'Notification Title'}
                      </h4>
                      <Badge className={getTypeColor(formData.type)}>
                        {formData.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formData.message || 'Notification message will appear here...'}
                    </p>
                    {formData.action_url && (
                      <p className="text-xs text-blue-600 mt-1">
                        🔗 Action: {formData.action_url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.message.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPanel;
