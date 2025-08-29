
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { Monitor, Smartphone, Clock, Globe, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  user_agent?: string;
  ip_address?: string;
  country?: string;
  region?: string;
  last_seen: string;
  revoked_at?: string;
  user_name?: string;
  user_email?: string;
}

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // First load devices, then load user profiles separately
      const { data: devicesData, error: devicesError } = await supabase
        .from('user_devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (devicesError) throw devicesError;

      // Load user profiles for the devices
      const userIds = [...new Set(devicesData.map(d => d.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to devices
      const profilesMap = new Map(profilesData.map(p => [p.id, p]));
      
      const devicesWithUserInfo = devicesData.map(device => {
        const profile = profilesMap.get(device.user_id);
        return {
          ...device,
          user_name: profile?.full_name || 'Unknown User',
          user_email: profile?.email || 'unknown@email.com'
        };
      });

      setDevices(devicesWithUserInfo);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('Device revoked successfully');
      loadDevices();
    } catch (error) {
      console.error('Error revoking device:', error);
      toast.error('Failed to revoke device');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Monitor className="h-5 w-5 mr-2" />
          Device Management
        </CardTitle>
        <CardDescription>
          Monitor and manage user device sessions across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                No active device sessions found.
              </span>
            </div>
          ) : (
            devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getDeviceIcon(device.user_agent)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {device.device_name}
                    </span>
                    {device.revoked_at ? (
                      <Badge variant="destructive" className="text-xs">
                        Revoked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>{device.user_name}</span>
                      <span className="text-gray-400">•</span>
                      <span>{device.user_email}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{device.ip_address}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span>{device.country}</span>
                      {device.region && <span>• {device.region}</span>}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatLastSeen(device.last_seen)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {device.revoked_at ? (
                  <Badge variant="outline" className="text-xs">
                    Revoked {formatLastSeen(device.revoked_at)}
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeDevice(device.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
