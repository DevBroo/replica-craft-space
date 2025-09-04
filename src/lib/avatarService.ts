import { supabase } from "@/integrations/supabase/client";

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const avatarService = {
  /**
   * Upload avatar image to Supabase Storage
   */
  async uploadAvatar(file: File, userId: string): Promise<AvatarUploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Please upload a valid image file (JPG, PNG, WebP, or GIF)'
        };
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'Image file size must be less than 5MB'
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `avatars/${userId}/${fileName}`;

      // Upload to public-images bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return {
          success: false,
          error: 'Failed to upload image. Please try again.'
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return {
          success: false,
          error: 'Failed to generate image URL'
        };
      }

      return {
        success: true,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while uploading'
      };
    }
  },

  /**
   * Delete avatar from storage (optional cleanup)
   */
  async deleteAvatar(url: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/storage/v1/object/public/public-images/');
      if (urlParts.length !== 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('public-images')
        .remove([filePath]);

      return !error;
    } catch (error) {
      console.error('Avatar delete error:', error);
      return false;
    }
  }
};