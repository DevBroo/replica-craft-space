import { supabase } from '@/integrations/supabase/client';

export const uploadBrandingAsset = async (
  file: File,
  type: 'logo' | 'favicon' | 'background'
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${type}-${Date.now()}.${fileExt}`;
  const filePath = `${type}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('branding')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('branding')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteBrandingAsset = async (url: string): Promise<void> => {
  if (!url) return;
  
  try {
    const path = new URL(url).pathname.split('/branding/')[1];
    if (path) {
      await supabase.storage.from('branding').remove([path]);
    }
  } catch (error) {
    console.error('Error deleting branding asset:', error);
  }
};

export const getAvailableFonts = () => {
  return [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: 'Open Sans, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Source Sans Pro', family: 'Source Sans Pro, sans-serif' },
    { name: 'Nunito', family: 'Nunito, sans-serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Ubuntu', family: 'Ubuntu, sans-serif' }
  ];
};

export const loadGoogleFont = (fontFamily: string) => {
  const fontName = fontFamily.split(',')[0].replace(/'/g, '');
  const formattedName = fontName.replace(/ /g, '+');
  
  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href*="${formattedName}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const applyCustomFont = (fontFamily: string, selector: string = 'body') => {
  const style = document.createElement('style');
  style.textContent = `
    ${selector} {
      font-family: ${fontFamily} !important;
    }
  `;
  document.head.appendChild(style);
};

export const generateEmailTemplate = (
  config: {
    header_logo: string;
    footer_text: string;
    primary_color: string;
  },
  content: string,
  subject: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${config.primary_color}; padding: 20px; text-align: center; }
        .header img { max-height: 60px; }
        .content { padding: 30px; }
        .footer { background-color: #f1f3f4; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${config.header_logo ? `
          <div class="header">
            <img src="${config.header_logo}" alt="Logo" />
          </div>
        ` : ''}
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          ${config.footer_text || 'This email was sent by Picnify'}
        </div>
      </div>
    </body>
    </html>
  `;
};