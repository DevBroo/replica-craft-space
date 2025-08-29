import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, MessageSquare, Bell, Search, Filter } from 'lucide-react';

interface UserPreference {
  id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  category: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  user_name: string;
  user_email: string;
  user_role: string;
}

interface PreferenceStats {
  total_users: number;
  email_enabled: number;
  sms_enabled: number;
  push_enabled: number;
  in_app_enabled: number;
}

export const UserPreferencesManager: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [stats, setStats] = useState<PreferenceStats>({
    total_users: 0,
    email_enabled: 0,
    sms_enabled: 0,
    push_enabled: 0,
    in_app_enabled: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => {
    loadPreferences();
    loadStats();
  }, []);

  const loadPreferences = async () => {
    console.log('📊 Loading user notification preferences...');
    setLoading(true);
    try {
      // Mock data for now - in real implementation, join with profiles table
      const mockPreferences: UserPreference[] = [
        {
          id: '1',
          user_id: 'user1',
          channel: 'email',
          category: 'booking',
          enabled: true,
          frequency: 'immediate',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          user_role: 'user'
        },
        {
          id: '2',
          user_id: 'user1',
          channel: 'sms',
          category: 'booking',
          enabled: false,
          frequency: 'never',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          user_role: 'user'
        },
        {
          id: '3',
          user_id: 'user2',
          channel: 'email',
          category: 'payment',
          enabled: true,
          frequency: 'immediate',
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          user_role: 'property_owner'
        }
      ];
      
      setPreferences(mockPreferences);
      console.log('✅ Loaded preferences:', mockPreferences.length);
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load user preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    console.log('📈 Loading preference statistics...');
    try {
      // Mock stats for now
      const mockStats: PreferenceStats = {
        total_users: 1250,
        email_enabled: 1100,
        sms_enabled: 320,
        push_enabled: 890,
        in_app_enabled: 1200
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const updatePreference = async (preferenceId: string, enabled: boolean) => {
    console.log('🔄 Updating preference:', preferenceId, enabled);
    try {
      setPreferences(prev => prev.map(pref =>
        pref.id === preferenceId
          ? { ...pref, enabled }
          : pref
      ));
      
      // In real implementation, update the database
      // await supabase
      //   .from('user_notification_preferences')
      //   .update({ enabled })
      //   .eq('id', preferenceId);
      
      toast({
        title: "Success",
        description: "Preference updated successfully",
      });
      
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('❌ Error updating preference:', error);
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive"
      });
    }
  };

  const bulkUpdatePreferences = async (updates: { channel: string; category: string; enabled: boolean }) => {
    console.log('🔄 Bulk updating preferences:', updates);
    setLoading(true);
    try {
      // Mock bulk update
      toast({
        title: "Success",
        description: `Bulk updated ${updates.channel} preferences for ${updates.category}`,
      });
      
      await loadPreferences();
      await loadStats();
    } catch (error) {
      console.error('❌ Error bulk updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to bulk update preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPreferences = async () => {
    console.log('📤 Exporting user preferences...');
    try {
      const csvContent = [
        'User Name,Email,Role,Channel,Category,Enabled,Frequency',
        ...preferences.map(pref => 
          `${pref.user_name},${pref.user_email},${pref.user_role},${pref.channel},${pref.category},${pref.enabled},${pref.frequency}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-preferences-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Preferences exported successfully",
      });
    } catch (error) {
      console.error('❌ Error exporting preferences:', error);
      toast({
        title: "Error",
        description: "Failed to export preferences",
        variant: "destructive"
      });
    }
  };

  const filteredPreferences = preferences.filter(pref => {
    const matchesSearch = pref.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pref.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || pref.channel === filterChannel;
    const matchesRole = filterRole === 'all' || pref.user_role === filterRole;
    
    return matchesSearch && matchesChannel && matchesRole;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'in_app': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-medium">User Notification Preferences</h2>
        </div>
        <Button onClick={exportPreferences}>
          Export Preferences
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.email_enabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.email_enabled / stats.total_users) * 100)}% enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sms_enabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.sms_enabled / stats.total_users) * 100)}% enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Push
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.push_enabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.push_enabled / stats.total_users) * 100)}% enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              In-App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_app_enabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.in_app_enabled / stats.total_users) * 100)}% enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter-channel">Channel</Label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-role">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="property_owner">Property Owners</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterChannel('all');
                  setFilterRole('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Preferences</CardTitle>
          <CardDescription>
            Manage individual user notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPreferences.map((preference) => (
              <div key={preference.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getChannelIcon(preference.channel)}
                  <div>
                    <h4 className="font-medium">{preference.user_name}</h4>
                    <p className="text-sm text-muted-foreground">{preference.user_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{preference.user_role}</Badge>
                    <Badge variant="outline">{preference.channel}</Badge>
                    <Badge variant="outline">{preference.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {preference.frequency}
                  </span>
                  <Switch
                    checked={preference.enabled}
                    onCheckedChange={(checked) => updatePreference(preference.id, checked)}
                  />
                </div>
              </div>
            ))}
            {filteredPreferences.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No preferences found</p>
                <p className="text-xs">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Apply changes to multiple users at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => bulkUpdatePreferences({ channel: 'email', category: 'booking', enabled: true })}
              disabled={loading}
            >
              Enable Email for Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => bulkUpdatePreferences({ channel: 'sms', category: 'security', enabled: true })}
              disabled={loading}
            >
              Enable SMS for Security
            </Button>
            <Button
              variant="outline"
              onClick={() => bulkUpdatePreferences({ channel: 'push', category: 'payment', enabled: true })}
              disabled={loading}
            >
              Enable Push for Payments
            </Button>
            <Button
              variant="outline"
              onClick={() => bulkUpdatePreferences({ channel: 'in_app', category: 'system', enabled: true })}
              disabled={loading}
            >
              Enable In-App for System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};