import React from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { shareUtils } from '@/lib/shareUtils';

interface ShareDropdownProps {
  property?: any;
  booking?: any;
  onShareSuccess?: () => void;
  onCopySuccess?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const ShareDropdown: React.FC<ShareDropdownProps> = ({
  property,
  booking,
  onShareSuccess,
  onCopySuccess,
  className = '',
  size = 'icon',
  variant = 'outline'
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    let success = false;
    
    if (property) {
      success = await shareUtils.shareProperty(property);
    } else if (booking) {
      success = await shareUtils.shareBooking(booking);
    }
    
    if (success && onShareSuccess) {
      onShareSuccess();
    }
  };

  const handleCopy = async () => {
    let success = false;
    
    if (property) {
      success = await shareUtils.copyPropertyLink(property);
    } else if (booking) {
      success = await shareUtils.copyBookingLink(booking);
    }
    
    if (success) {
      setCopied(true);
      if (onCopySuccess) {
        onCopySuccess();
      }
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
