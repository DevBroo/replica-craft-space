import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Switch } from '@/components/admin/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { Separator } from '@/components/admin/ui/separator';
import { Textarea } from '@/components/admin/ui/textarea';
import { Save, RotateCcw, Palette, Layout, Type, Image, Mail, Eye } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { BrandingUpload } from './BrandingUpload';
import { PreviewPanel } from './PreviewPanel';
import { getAvailableFonts, loadGoogleFont } from '@/lib/brandingService';
import { useToast } from '@/hooks/use-toast';

export const EnhancedAppearanceSettings: React.FC = () => {
  const { 
    config, 
    updateConfig, 
    saveConfig, 
    resetToDefaults, 
    loading, 
    saving,
    previewMode 
  } = useAppearance();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('theme');

  const handleSave = async () => {
    try {
      await saveConfig();
      toast({
        title: "Settings saved",
        description: "Appearance settings have been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save appearance settings",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: "Settings reset",
      description: "Appearance settings have been reset to defaults"
    });
  };

  const handleFontChange = (fontType: 'primary_font' | 'secondary_font', fontFamily: string) => {
    updateConfig({
      fonts: {
        ...config.fonts,
        [fontType]: fontFamily
      }
    });
    
    // Load Google Font if not already loaded
    loadGoogleFont(fontFamily);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appearance Settings</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your admin dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="theme" className="gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Image className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="fonts" className="gap-2">
                <Type className="h-4 w-4" />
                Fonts
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme & Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Theme Mode</Label>
                      <Select
                        value={config.theme}
                        onValueChange={(value) => updateConfig({ theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Display Options</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="compact-mode">Compact Mode</Label>
                          <Switch
                            id="compact-mode"
                            checked={config.compactMode}
                            onCheckedChange={(checked) => updateConfig({ compactMode: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="breadcrumbs">Show Breadcrumbs</Label>
                          <Switch
                            id="breadcrumbs"
                            checked={config.showBreadcrumbs}
                            onCheckedChange={(checked) => updateConfig({ showBreadcrumbs: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                          className="w-16 h-10 p-1 border"
                        />
                        <Input
                          value={config.primaryColor}
                          onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={config.secondaryColor}
                          onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                          className="w-16 h-10 p-1 border"
                        />
                        <Input
                          value={config.secondaryColor}
                          onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Background</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={config.background.type === 'color' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig({
                          background: { ...config.background, type: 'color' }
                        })}
                      >
                        Color
                      </Button>
                      <Button
                        variant={config.background.type === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig({
                          background: { ...config.background, type: 'image' }
                        })}
                      >
                        Image
                      </Button>
                      <Button
                        variant={config.background.type === 'gradient' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateConfig({
                          background: { ...config.background, type: 'gradient' }
                        })}
                      >
                        Gradient
                      </Button>
                    </div>

                    {config.background.type === 'color' && (
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.background.value}
                          onChange={(e) => updateConfig({
                            background: { ...config.background, value: e.target.value }
                          })}
                          className="w-16 h-10 p-1 border"
                        />
                        <Input
                          value={config.background.value}
                          onChange={(e) => updateConfig({
                            background: { ...config.background, value: e.target.value }
                          })}
                          placeholder="#ffffff"
                        />
                      </div>
                    )}

                    {config.background.type === 'image' && (
                      <BrandingUpload
                        type="background"
                        currentUrl={config.background.image_url}
                        onUpload={(url) => updateConfig({
                          background: { ...config.background, image_url: url }
                        })}
                        label="Background Image"
                        description="Upload a background image for the admin dashboard"
                      />
                    )}

                    {config.background.type === 'gradient' && (
                      <div className="space-y-2">
                        <Input
                          value={config.background.gradient}
                          onChange={(e) => updateConfig({
                            background: { ...config.background, gradient: e.target.value }
                          })}
                          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a CSS gradient (e.g., linear-gradient, radial-gradient)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={config.branding.company_name}
                      onChange={(e) => updateConfig({
                        branding: { ...config.branding, company_name: e.target.value }
                      })}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <Separator />

                  <BrandingUpload
                    type="logo"
                    currentUrl={config.branding.logo_url}
                    onUpload={(url) => updateConfig({
                      branding: { ...config.branding, logo_url: url }
                    })}
                    label="Company Logo"
                    description="Upload your company logo for the admin header"
                  />

                  <Separator />

                  <BrandingUpload
                    type="favicon"
                    currentUrl={config.branding.favicon_url}
                    onUpload={(url) => updateConfig({
                      branding: { ...config.branding, favicon_url: url }
                    })}
                    label="Favicon"
                    description="Upload a favicon for the browser tab"
                    accept="image/png,image/ico,image/x-icon"
                  />

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="powered-by">Show "Powered by Picnify"</Label>
                      <p className="text-sm text-muted-foreground">
                        Display attribution in the footer
                      </p>
                    </div>
                    <Switch
                      id="powered-by"
                      checked={config.branding.show_powered_by}
                      onCheckedChange={(checked) => updateConfig({
                        branding: { ...config.branding, show_powered_by: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sidebar Position</Label>
                      <Select
                        value={config.layout.sidebar_position}
                        onValueChange={(value: 'left' | 'right') => updateConfig({
                          layout: { ...config.layout, sidebar_position: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sidebar Style</Label>
                      <Select
                        value={config.sidebarStyle}
                        onValueChange={(value) => updateConfig({ sidebarStyle: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expanded">Expanded</SelectItem>
                          <SelectItem value="collapsed">Collapsed</SelectItem>
                          <SelectItem value="mini">Mini</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Content Layout</Label>
                      <Select
                        value={config.layout.content_layout}
                        onValueChange={(value: 'card' | 'grid') => updateConfig({
                          layout: { ...config.layout, content_layout: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Card View</SelectItem>
                          <SelectItem value="grid">Grid View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Header Style</Label>
                      <Select
                        value={config.layout.header_style}
                        onValueChange={(value: 'default' | 'minimal' | 'compact') => updateConfig({
                          layout: { ...config.layout, header_style: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fonts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Font</Label>
                      <Select
                        value={config.fonts.primary_font}
                        onValueChange={(value) => handleFontChange('primary_font', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFonts().map((font) => (
                            <SelectItem key={font.name} value={font.name}>
                              <span style={{ fontFamily: font.family }}>
                                {font.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Secondary Font</Label>
                      <Select
                        value={config.fonts.secondary_font}
                        onValueChange={(value) => handleFontChange('secondary_font', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableFonts().map((font) => (
                            <SelectItem key={font.name} value={font.name}>
                              <span style={{ fontFamily: font.family }}>
                                {font.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Preview</Label>
                    <div className="p-4 border border-border rounded-lg space-y-2">
                      <h3 
                        style={{ fontFamily: config.fonts.primary_font }}
                        className="text-lg font-semibold"
                      >
                        Primary Font: This is a heading
                      </h3>
                      <p 
                        style={{ fontFamily: config.fonts.secondary_font }}
                        className="text-sm text-muted-foreground"
                      >
                        Secondary Font: This is body text used for descriptions and content.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <BrandingUpload
                    type="logo"
                    currentUrl={config.email_templates.header_logo}
                    onUpload={(url) => updateConfig({
                      email_templates: { ...config.email_templates, header_logo: url }
                    })}
                    label="Email Header Logo"
                    description="Logo to display in email headers"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="email-primary-color">Email Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.email_templates.primary_color}
                        onChange={(e) => updateConfig({
                          email_templates: { ...config.email_templates, primary_color: e.target.value }
                        })}
                        className="w-16 h-10 p-1 border"
                      />
                      <Input
                        value={config.email_templates.primary_color}
                        onChange={(e) => updateConfig({
                          email_templates: { ...config.email_templates, primary_color: e.target.value }
                        })}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-footer">Email Footer Text</Label>
                    <Textarea
                      id="email-footer"
                      value={config.email_templates.footer_text}
                      onChange={(e) => updateConfig({
                        email_templates: { ...config.email_templates, footer_text: e.target.value }
                      })}
                      placeholder="© 2024 Your Company. All rights reserved."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
};