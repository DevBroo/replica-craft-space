import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppearanceConfig {
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  sidebarStyle: string;
  showBreadcrumbs: boolean;
  compactMode: boolean;
  branding: {
    logo_url: string;
    favicon_url: string;
    company_name: string;
    show_powered_by: boolean;
  };
  fonts: {
    primary_font: string;
    secondary_font: string;
    custom_fonts: string[];
  };
  layout: {
    sidebar_position: 'left' | 'right';
    content_layout: 'card' | 'grid';
    header_style: 'default' | 'minimal' | 'compact';
  };
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
    image_url: string;
    gradient: string;
  };
  email_templates: {
    header_logo: string;
    footer_text: string;
    primary_color: string;
  };
}

const defaultConfig: AppearanceConfig = {
  theme: 'system',
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  sidebarStyle: 'expanded',
  showBreadcrumbs: true,
  compactMode: false,
  branding: {
    logo_url: '',
    favicon_url: '',
    company_name: 'Picnify',
    show_powered_by: true
  },
  fonts: {
    primary_font: 'Inter',
    secondary_font: 'Inter',
    custom_fonts: []
  },
  layout: {
    sidebar_position: 'left',
    content_layout: 'card',
    header_style: 'default'
  },
  background: {
    type: 'color',
    value: '#ffffff',
    image_url: '',
    gradient: ''
  },
  email_templates: {
    header_logo: '',
    footer_text: '',
    primary_color: '#3B82F6'
  }
};

interface AppearanceContextType {
  config: AppearanceConfig;
  updateConfig: (updates: Partial<AppearanceConfig>) => void;
  saveConfig: () => Promise<void>;
  resetToDefaults: () => void;
  loading: boolean;
  saving: boolean;
  previewMode: boolean;
  setPreviewMode: (enabled: boolean) => void;
  previewConfig: AppearanceConfig | null;
  setPreviewConfig: (config: AppearanceConfig | null) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppearanceConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<AppearanceConfig | null>(null);

  const activeConfig = previewMode && previewConfig ? previewConfig : config;

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    applyConfigToDOM(activeConfig);
  }, [activeConfig]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'appearance')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading appearance config:', error);
        return;
      }

      if (data?.value) {
        const savedConfig = { ...defaultConfig, ...(data.value as any) };
        
        // Merge extended config if available
        if (data.extended_config) {
          Object.assign(savedConfig, data.extended_config as any);
        }
        
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Error loading appearance config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<AppearanceConfig>) => {
    if (previewMode) {
      setPreviewConfig(prev => ({ ...(prev || config), ...updates }));
    } else {
      setConfig(prev => ({ ...prev, ...updates }));
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configToSave = previewMode && previewConfig ? previewConfig : config;
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'appearance',
          category: 'appearance',
          value: configToSave as any,
          is_secret: false,
          extended_config: {
            branding: configToSave.branding,
            fonts: configToSave.fonts,
            layout: configToSave.layout,
            background: configToSave.background,
            email_templates: configToSave.email_templates
          } as any
        });

      if (error) throw error;

      if (previewMode && previewConfig) {
        setConfig(previewConfig);
        setPreviewConfig(null);
        setPreviewMode(false);
      }
    } catch (error) {
      console.error('Error saving appearance config:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (previewMode) {
      setPreviewConfig(defaultConfig);
    } else {
      setConfig(defaultConfig);
    }
  };

  const applyConfigToDOM = (configToApply: AppearanceConfig) => {
    const root = document.documentElement;
    
    // Apply theme
    if (configToApply.theme === 'dark') {
      root.classList.add('dark');
    } else if (configToApply.theme === 'light') {
      root.classList.remove('dark');
    }

    // Apply colors
    root.style.setProperty('--primary', configToApply.primaryColor);
    root.style.setProperty('--secondary', configToApply.secondaryColor);

    // Apply fonts
    if (configToApply.fonts.primary_font) {
      root.style.setProperty('--font-primary', configToApply.fonts.primary_font);
    }

    // Apply background
    if (configToApply.background.type === 'color') {
      document.body.style.backgroundColor = configToApply.background.value;
      document.body.style.backgroundImage = 'none';
    } else if (configToApply.background.type === 'image' && configToApply.background.image_url) {
      document.body.style.backgroundImage = `url(${configToApply.background.image_url})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    } else if (configToApply.background.type === 'gradient' && configToApply.background.gradient) {
      document.body.style.backgroundImage = configToApply.background.gradient;
    }

    // Apply favicon
    if (configToApply.branding.favicon_url) {
      updateFavicon(configToApply.branding.favicon_url);
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  };

  return (
    <AppearanceContext.Provider
      value={{
        config: activeConfig,
        updateConfig,
        saveConfig,
        resetToDefaults,
        loading,
        saving,
        previewMode,
        setPreviewMode,
        previewConfig,
        setPreviewConfig
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};