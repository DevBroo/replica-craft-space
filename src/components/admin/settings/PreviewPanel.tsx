import React, { useState } from 'react';
import { Eye, EyeOff, Monitor, Smartphone, Tablet, Users, User, UserCog } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Badge } from '@/components/admin/ui/badge';
import { Separator } from '@/components/admin/ui/separator';
import { useAppearance } from '@/contexts/AppearanceContext';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
type PreviewRole = 'admin' | 'owner' | 'agent' | 'user';

export const PreviewPanel: React.FC = () => {
  const { 
    previewMode, 
    setPreviewMode, 
    config, 
    previewConfig,
    setPreviewConfig 
  } = useAppearance();
  
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewRole, setPreviewRole] = useState<PreviewRole>('admin');

  const togglePreview = () => {
    if (previewMode) {
      setPreviewMode(false);
      setPreviewConfig(null);
    } else {
      setPreviewMode(true);
      setPreviewConfig(config);
    }
  };

  const getDeviceClasses = () => {
    switch (previewDevice) {
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'mobile':
        return 'max-w-sm mx-auto';
      default:
        return 'w-full';
    }
  };

  const getRoleColor = (role: PreviewRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'owner': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-gray-100 text-gray-800';
    }
  };

  const activeConfig = previewMode && previewConfig ? previewConfig : config;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={togglePreview}
            className="gap-2"
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Exit Preview' : 'Enter Preview'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewMode && (
          <>
            {/* Device Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Device:</span>
              <div className="flex gap-1">
                <Button
                  variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('desktop')}
                  className="p-2"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('tablet')}
                  className="p-2"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('mobile')}
                  className="p-2"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View as:</span>
              <div className="flex gap-1">
                {(['admin', 'owner', 'agent', 'user'] as PreviewRole[]).map((role) => (
                  <Button
                    key={role}
                    variant={previewRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewRole(role)}
                    className="gap-1 text-xs"
                  >
                    {role === 'admin' && <UserCog className="h-3 w-3" />}
                    {role === 'owner' && <Users className="h-3 w-3" />}
                    {role === 'agent' && <User className="h-3 w-3" />}
                    {role === 'user' && <User className="h-3 w-3" />}
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Preview Window */}
            <div className={`border border-border rounded-lg overflow-hidden ${getDeviceClasses()}`}>
              <div className="bg-muted px-3 py-2 flex items-center justify-between text-xs">
                <span>Preview Mode</span>
                <Badge className={getRoleColor(previewRole)}>
                  {previewRole.toUpperCase()}
                </Badge>
              </div>
              
              <div 
                className="min-h-[300px] p-4"
                style={{
                  backgroundColor: activeConfig.background.type === 'color' 
                    ? activeConfig.background.value 
                    : undefined,
                  backgroundImage: activeConfig.background.type === 'image' && activeConfig.background.image_url
                    ? `url(${activeConfig.background.image_url})`
                    : activeConfig.background.type === 'gradient' && activeConfig.background.gradient
                    ? activeConfig.background.gradient
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Mock Header */}
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
                    activeConfig.layout.header_style === 'minimal' ? 'border-b' : 'bg-background shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {activeConfig.branding.logo_url ? (
                      <img 
                        src={activeConfig.branding.logo_url} 
                        alt="Logo" 
                        className="h-8 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-24 bg-primary rounded" />
                    )}
                    <span className="font-semibold text-lg">
                      {activeConfig.branding.company_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-avatar rounded-full" />
                    <span className="text-sm">Admin User</span>
                  </div>
                </div>

                {/* Mock Content */}
                <div className={`grid gap-4 ${
                  activeConfig.layout.content_layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1'
                }`}>
                  <Card className={activeConfig.compactMode ? 'p-3' : 'p-4'}>
                    <CardHeader className={activeConfig.compactMode ? 'pb-2' : 'pb-4'}>
                      <CardTitle style={{ color: activeConfig.primaryColor }}>
                        Dashboard Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Revenue</span>
                          <span className="font-semibold">₹1,23,456</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bookings</span>
                          <span className="font-semibold">245</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={activeConfig.compactMode ? 'p-3' : 'p-4'}>
                    <CardHeader className={activeConfig.compactMode ? 'pb-2' : 'pb-4'}>
                      <CardTitle style={{ color: activeConfig.secondaryColor }}>
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>New booking: Villa Paradise</div>
                        <div>Property approved: Beach Resort</div>
                        <div>Payment received: ₹15,000</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mock Sidebar Preview */}
                <div className="mt-4 p-3 bg-background/80 rounded-lg">
                  <div className="text-sm">
                    <strong>Sidebar Position:</strong> {activeConfig.layout.sidebar_position}
                  </div>
                  <div className="text-sm">
                    <strong>Layout:</strong> {activeConfig.layout.content_layout}
                  </div>
                  <div className="text-sm">
                    <strong>Font:</strong> {activeConfig.fonts.primary_font}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!previewMode && (
          <div className="text-center text-muted-foreground py-8">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Enter Preview" to see your changes in real-time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};