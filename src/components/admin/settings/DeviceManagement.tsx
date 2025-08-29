
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { Monitor, Smartphone, Clock, Globe, AlertTriangle } from 'lucide-react';

export const DeviceManagement: React.FC = () => {
  const [devices] = useState([
    {
      id: '1',
      device_name: 'Chrome on Windows',
      ip_address: '192.168.1.100',
      country: 'India',
      region: 'Maharashtra',
      last_seen: new Date().toISOString(),
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      user_name: 'Current Session',
      user_email: 'admin@picnify.com'
    }
  ]);

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

  const handleRevokeDevice = (deviceId: string) => {
    toast.info('Device management functionality will be available once the database types are updated');
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
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Device management is being configured. Currently showing sample data.
            </span>
          </div>
          
          {devices.map((device) => (
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
                    <Badge variant="secondary" className="text-xs">
                      Current Session
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeDevice(device.id)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled
                >
                  Current Session
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
