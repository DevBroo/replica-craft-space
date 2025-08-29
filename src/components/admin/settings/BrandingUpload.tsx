import React, { useState } from 'react';
import { Upload, X, Eye } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Label } from '@/components/admin/ui/label';
import { uploadBrandingAsset, deleteBrandingAsset } from '@/lib/brandingService';
import { useToast } from '@/hooks/use-toast';

interface BrandingUploadProps {
  type: 'logo' | 'favicon' | 'background';
  currentUrl: string;
  onUpload: (url: string) => void;
  label: string;
  description?: string;
  accept?: string;
}

export const BrandingUpload: React.FC<BrandingUploadProps> = ({
  type,
  currentUrl,
  onUpload,
  label,
  description,
  accept = "image/*"
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload file
      const url = await uploadBrandingAsset(file, type);
      onUpload(url);
      
      toast({
        title: "Upload successful",
        description: `${label} has been uploaded successfully`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      if (currentUrl) {
        await deleteBrandingAsset(currentUrl);
      }
      onUpload('');
      setPreviewUrl(null);
      
      toast({
        title: "Removed",
        description: `${label} has been removed`
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove file",
        variant: "destructive"
      });
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {displayUrl && (
          <div className="relative group">
            <div className="w-16 h-16 border border-border rounded-lg overflow-hidden bg-muted">
              <img
                src={displayUrl}
                alt={label}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(displayUrl, '_blank')}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1">
          <input
            type="file"
            id={`${type}-upload`}
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <Label
            htmlFor={`${type}-upload`}
            className={`inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : displayUrl ? 'Replace' : 'Upload'}
          </Label>
        </div>
      </div>

      {type === 'logo' && (
        <p className="text-xs text-muted-foreground">
          Recommended: PNG or SVG, 200x60px max, transparent background
        </p>
      )}
      {type === 'favicon' && (
        <p className="text-xs text-muted-foreground">
          Recommended: PNG or ICO, 32x32px or 16x16px
        </p>
      )}
      {type === 'background' && (
        <p className="text-xs text-muted-foreground">
          Recommended: JPG or PNG, 1920x1080px, under 2MB
        </p>
      )}
    </div>
  );
};