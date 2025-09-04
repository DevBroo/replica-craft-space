import React, { useState } from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Progress } from '@/components/owner/ui/progress';
import { ArrowLeft, ArrowRight, Upload, X, Star, Eye, Camera, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotosMediaProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const PHOTO_CATEGORIES = [
  { value: 'exterior', label: 'Exterior View', description: 'Outside shots of the property' },
  { value: 'interior', label: 'Interior Common Areas', description: 'Lobby, lounge, common spaces' },
  { value: 'room', label: 'Guest Rooms', description: 'Bedrooms, living areas' },
  { value: 'bathroom', label: 'Bathrooms', description: 'Private and shared bathrooms' },
  { value: 'amenity', label: 'Amenities', description: 'Pool, gym, restaurant, etc.' },
  { value: 'view', label: 'Views', description: 'What guests can see from the property' },
  { value: 'dining', label: 'Dining Areas', description: 'Restaurant, kitchen, dining room' },
  { value: 'recreation', label: 'Recreation', description: 'Entertainment and activity areas' }
];

// Sample placeholder images for demonstration
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop'
];

const PhotosMedia: React.FC<PhotosMediaProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('exterior');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Image upload function using the same storage as day picnic and location images
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `property-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const imageUrl = await uploadImage(file);
        setUploadProgress(((index + 1) / files.length) * 100);
        
        return {
          image_url: imageUrl,
          caption: `Property image ${formData.photos_with_captions.length + index + 1}`,
          alt_text: `${formData.title || 'Property'} - Image`,
          category: 'exterior',
          display_order: formData.photos_with_captions.length + index,
          is_primary: formData.photos_with_captions.length === 0 && index === 0
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      const newImageUrls = newPhotos.map(photo => photo.image_url);

      setFormData(prev => ({
        ...prev,
        photos_with_captions: [...prev.photos_with_captions, ...newPhotos],
        images: [...prev.images, ...newImageUrls]
      }));

      toast({
        title: "Images uploaded successfully!",
        description: `${files.length} image(s) added to your property listing.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const imageUrl = await uploadImage(file);
        setUploadProgress(((index + 1) / files.length) * 100);
        
        return {
          image_url: imageUrl,
          caption: `Property image ${formData.photos_with_captions.length + index + 1}`,
          alt_text: `${formData.title || 'Property'} - Image`,
          category: 'exterior',
          display_order: formData.photos_with_captions.length + index,
          is_primary: formData.photos_with_captions.length === 0 && index === 0
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      const newImageUrls = newPhotos.map(photo => photo.image_url);

      setFormData(prev => ({
        ...prev,
        photos_with_captions: [...prev.photos_with_captions, ...newPhotos],
        images: [...prev.images, ...newImageUrls]
      }));

      toast({
        title: "Images uploaded successfully!",
        description: `${files.length} image(s) added via drag and drop.`,
      });
    } catch (error) {
      console.error('Error uploading dropped images:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload dropped images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const addPhotoFromUrl = () => {
    if (!newPhotoUrl.trim()) return;

    const newPhoto = {
      image_url: newPhotoUrl,
      caption: newPhotoCaption || 'Property image',
      alt_text: newPhotoCaption || 'Property image',
      category: newPhotoCategory,
      display_order: formData.photos_with_captions.length,
      is_primary: formData.photos_with_captions.length === 0
    };

    setFormData(prev => ({
      ...prev,
      photos_with_captions: [...prev.photos_with_captions, newPhoto],
      images: [...prev.images, newPhoto.image_url]
    }));

    // Reset form
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setNewPhotoCategory('exterior');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos_with_captions: prev.photos_with_captions.filter((_, i) => i !== index),
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addSamplePhotos = () => {
    const samplePhotos = SAMPLE_IMAGES.slice(0, 5).map((url, index) => ({
      image_url: url,
      caption: `Beautiful ${formData.property_type.toLowerCase()} ${['exterior', 'interior', 'room', 'amenity', 'view'][index]}`,
      alt_text: `${formData.title} - ${['exterior', 'interior', 'room', 'amenity', 'view'][index]} view`,
      category: ['exterior', 'interior', 'room', 'amenity', 'view'][index],
      display_order: index,
      is_primary: index === 0
    }));

    setFormData(prev => ({
      ...prev,
      photos_with_captions: samplePhotos,
      images: samplePhotos.map(p => p.image_url)
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos_with_captions: prev.photos_with_captions.filter((_, i) => i !== index),
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updatePhoto = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      photos_with_captions: prev.photos_with_captions.map((photo, i) =>
        i === index ? { ...photo, [field]: value } : photo
      )
    }));
  };

  const setPrimaryPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos_with_captions: prev.photos_with_captions.map((photo, i) => ({
        ...photo,
        is_primary: i === index
      }))
    }));
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const photos = [...formData.photos_with_captions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < photos.length) {
      [photos[index], photos[targetIndex]] = [photos[targetIndex], photos[index]];
      
      // Update display order
      photos.forEach((photo, i) => {
        photo.display_order = i;
      });

      setFormData(prev => ({
        ...prev,
        photos_with_captions: photos
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Property Photos & Media
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            High-quality photos significantly improve your booking rates. Add at least 5 photos for better visibility.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
            <div className="p-6 border-2 border-red-100 rounded-xl bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 transition-all duration-300 hover:shadow-lg hover:border-red-200">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold text-gray-800 mb-1">High Resolution</div>
              <div className="text-gray-600">At least 1024x768 pixels</div>
            </div>
            <div className="p-6 border-2 border-red-100 rounded-xl bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 transition-all duration-300 hover:shadow-lg hover:border-red-200">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold text-gray-800 mb-1">Good Lighting</div>
              <div className="text-gray-600">Natural light works best</div>
            </div>
            <div className="p-6 border-2 border-red-100 rounded-xl bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 transition-all duration-300 hover:shadow-lg hover:border-red-200">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="font-semibold text-gray-800 mb-1">Variety</div>
              <div className="text-gray-600">Show different areas & angles</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload Property Images</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-1"
              />
              {uploading && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading images...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div className="text-lg font-medium mb-2">
                {uploading ? 'Uploading...' : 'Drop your photos here'}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Drag and drop multiple images at once
              </div>
              <div className="text-xs text-muted-foreground">
                Supports: JPG, PNG, WebP, GIF (max 50MB each)
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="photo_url">Photo URL</Label>
              <Input
                id="photo_url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="photo_caption">Caption</Label>
              <Input
                id="photo_caption"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="Describe this photo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="photo_category">Category</Label>
              <Select value={newPhotoCategory} onValueChange={setNewPhotoCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={addPhotoFromUrl} disabled={!newPhotoUrl.trim()}>
              Add Photo
            </Button>
            <Button variant="outline" onClick={addSamplePhotos}>
              Add Sample Photos (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      {formData.photos_with_captions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Photo Gallery ({formData.photos_with_captions.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag photos to reorder. Click the star to set as primary photo.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.photos_with_captions.map((photo, index) => (
                <div key={index} className="relative group border rounded-lg overflow-hidden">
                  <div className="aspect-[4/3] bg-muted">
                    <img
                      src={photo.image_url}
                      alt={photo.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Photo Controls */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button
                      size="sm"
                      variant={photo.is_primary ? "default" : "secondary"}
                      className="h-8 w-8 p-0"
                      onClick={() => setPrimaryPhoto(index)}
                    >
                      <Star className={`w-3 h-3 ${photo.is_primary ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Primary Badge */}
                  {photo.is_primary && (
                    <Badge className="absolute top-2 left-2 text-xs">
                      Primary
                    </Badge>
                  )}

                  {/* Photo Details */}
                  <div className="p-3 space-y-2">
                    <div>
                      <Input
                        value={photo.caption}
                        onChange={(e) => updatePhoto(index, 'caption', e.target.value)}
                        placeholder="Add a caption"
                        className="text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Select
                        value={photo.category}
                        onValueChange={(value) => updatePhoto(index, 'category', value)}
                      >
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHOTO_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => movePhoto(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => movePhoto(index, 'down')}
                          disabled={index === formData.photos_with_captions.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Categories Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PHOTO_CATEGORIES.map(category => {
              const count = formData.photos_with_captions.filter(p => p.category === category.value).length;
              return (
                <div key={category.value} className="text-center p-4 border-2 border-red-100 rounded-xl bg-gradient-to-br from-red-50 to-white hover:from-red-100 hover:to-red-50 transition-all duration-300 hover:shadow-md hover:border-red-200">
                  <div className="text-2xl font-bold text-red-600 mb-1">{count}</div>
                  <div className="text-sm font-semibold text-gray-800">{category.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PhotosMedia;