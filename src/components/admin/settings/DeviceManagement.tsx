
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Monitor, Smartphone, Trash2, Shield, Globe, Clock } from 'lucide-react';

interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  last_seen: string;
  created_at: string;
  revoked_at: string | null;
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
      setLoading(true);
      
      const { data: devicesData, error } = await supabase
        .from('user_devices')
        .select('*')
        .is('revoked_at', null)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // Enrich with user data
      const enrichedDevices: UserDevice[] = [];
      if (devicesData) {
        for (const device of devicesData) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', device.user_id)
            .single();

          enrichedDevices.push({
            ...device,
            user_name: profile?.full_name || 'Unknown User',
            user_email: profile?.email || 'No email'
          });
        }
      }

      setDevices(enrichedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Device Management
          </CardTitle>
          <CardDescription>Monitor and manage user device sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active devices found
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
                        {device.device_name || 'Unknown Device'}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {device.device_id.substring(0, 8)}...
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>{device.user_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{device.user_email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {device.ip_address && (
                        <div className="flex items-center space-x-1">
                          <Globe className="h-3 w-3" />
                          <span>{device.ip_address}</span>
                        </div>
                      )}
                      
                      {device.country && (
                        <div className="flex items-center space-x-1">
                          <span>{device.country}</span>
                          {device.region && <span>• {device.region}</span>}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSeen(device.last_seen)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeDevice(device.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
