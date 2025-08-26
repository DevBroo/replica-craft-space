import React from 'react';
import { Play, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getOptimizedImageUrl } from '@/lib/imageOptimization';

interface HeroSectionProps {
  images: string[];
  title: string;
  locationText: string;
  onOpenLightbox: (index: number) => void;
  onOpenVideo?: () => void;
  hasVideo?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  images,
  title,
  locationText,
  onOpenLightbox,
  onOpenVideo,
  hasVideo = false
}) => {
  const primaryImage = images[0] || '/placeholder.svg';
  const thumbnails = images.slice(1, 5); // Get up to 4 thumbnails
  const totalImages = images.length;

  return (
    <div className="relative h-[60vh] min-h-[500px] overflow-hidden rounded-lg">
      {/* Primary background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${getOptimizedImageUrl(primaryImage, { width: 1200, height: 600 })})`
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
        {/* Top controls */}
        <div className="flex justify-end gap-3">
          {hasVideo && onOpenVideo && (
            <Button
              onClick={onOpenVideo}
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
            >
              <Play className="h-4 w-4 mr-2" />
              Play Video
            </Button>
          )}
        </div>
        
        {/* Bottom content */}
        <div className="space-y-4">
          {/* Title and location */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <p className="text-xl text-white/90">{locationText}</p>
          </div>
          
          {/* Gallery preview strip */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {thumbnails.map((image, index) => (
                <button
                  key={index}
                  onClick={() => onOpenLightbox(index + 1)}
                  className="relative w-16 h-12 rounded-md overflow-hidden hover:ring-2 hover:ring-white/50 transition-all"
                >
                  <img
                    src={getOptimizedImageUrl(image, { width: 80, height: 60 })}
                    alt={`Gallery ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            
            <Button
              onClick={() => onOpenLightbox(0)}
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
            >
              <Camera className="h-4 w-4 mr-2" />
              See all {totalImages} photos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};