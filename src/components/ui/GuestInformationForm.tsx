import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Phone, Calendar, AlertTriangle } from 'lucide-react';

export interface GuestInfo {
  name: string;
  phone: string;
  dateOfBirth: string;
}

interface GuestInformationFormProps {
  onGuestInfoChange: (guestInfo: GuestInfo) => void;
  initialData?: Partial<GuestInfo>;
  showTitle?: boolean;
  className?: string;
  required?: boolean;
}

const GuestInformationForm: React.FC<GuestInformationFormProps> = ({
  onGuestInfoChange,
  initialData = {},
  showTitle = true,
  className = '',
  required = true
}) => {
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: initialData.name || '',
    phone: initialData.phone || '',
    dateOfBirth: initialData.dateOfBirth || ''
  });

  const [errors, setErrors] = useState<Partial<GuestInfo>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof GuestInfo, boolean>>>({});

  useEffect(() => {
    onGuestInfoChange(guestInfo);
  }, [guestInfo, onGuestInfoChange]);

  const validateField = (field: keyof GuestInfo, value: string): string | null => {
    switch (field) {
      case 'name':
        if (required && !value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-'\.]+$/.test(value.trim())) return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
        return null;

      case 'phone':
        if (required && !value.trim()) return 'Phone number is required';
        // Remove all non-digit characters for validation
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10) return 'Phone number must be at least 10 digits';
        if (cleanPhone.length > 15) return 'Phone number cannot exceed 15 digits';
        // Indian phone number validation (optional, can be customized)
        if (cleanPhone.length === 10 && !/^[6-9]/.test(cleanPhone)) {
          return 'Indian phone numbers should start with 6, 7, 8, or 9';
        }
        return null;

      case 'dateOfBirth':
        if (required && !value) return 'Date of birth is required';
        if (value) {
          const dobDate = new Date(value);
          const today = new Date();
          const minDate = new Date('1900-01-01');
          
          if (isNaN(dobDate.getTime())) return 'Invalid date format';
          if (dobDate > today) return 'Date of birth cannot be in the future';
          if (dobDate < minDate) return 'Date of birth cannot be before 1900';
          
          // Check if person is at least 1 year old (reasonable for bookings)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (dobDate > oneYearAgo) return 'Guest must be at least 1 year old';
        }
        return null;

      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof GuestInfo, value: string) => {
    setGuestInfo(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof GuestInfo) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, guestInfo[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    // Format based on length
    if (cleanValue.length <= 3) {
      return cleanValue;
    } else if (cleanValue.length <= 6) {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3)}`;
    } else if (cleanValue.length <= 10) {
      return `${cleanValue.slice(0, 3)}-${cleanValue.slice(3, 6)}-${cleanValue.slice(6)}`;
    } else {
      // For international numbers, format as +XX-XXX-XXX-XXXX
      return `+${cleanValue.slice(0, 2)}-${cleanValue.slice(2, 5)}-${cleanValue.slice(5, 8)}-${cleanValue.slice(8, 12)}`;
    }
  };

  const isFormValid = (): boolean => {
    const nameError = validateField('name', guestInfo.name);
    const phoneError = validateField('phone', guestInfo.phone);
    const dobError = validateField('dateOfBirth', guestInfo.dateOfBirth);
    
    return !nameError && !phoneError && !dobError;
  };

  // Calculate max date (today) for date input
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Guest Information
            {required && <span className="text-red-500 ml-1">*</span>}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {required && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All guest information fields are required to complete your booking.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="guest-name" className="text-sm font-medium">
              Full Name {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="guest-name"
                type="text"
                value={guestInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Enter full name"
                className={`pl-10 ${errors.name && touched.name ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.name && touched.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="guest-phone" className="text-sm font-medium">
              Phone Number {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="guest-phone"
                type="tel"
                value={guestInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="Enter phone number"
                className={`pl-10 ${errors.phone && touched.phone ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.phone && touched.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500">
              Enter 10-digit mobile number (e.g., 9876543210)
            </p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="guest-dob" className="text-sm font-medium">
              Date of Birth {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="guest-dob"
                type="date"
                value={guestInfo.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                onBlur={() => handleBlur('dateOfBirth')}
                max={maxDate}
                min="1900-01-01"
                className={`pl-10 ${errors.dateOfBirth && touched.dateOfBirth ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.dateOfBirth && touched.dateOfBirth && (
              <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
            <p className="text-xs text-gray-500">
              Required for booking verification and age-appropriate services
            </p>
          </div>
        </div>

        {/* Validation Summary */}
        {required && Object.keys(touched).length > 0 && (
          <div className="pt-2">
            {isFormValid() ? (
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                All required information provided
              </div>
            ) : (
              <div className="flex items-center text-sm text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Please complete all required fields
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuestInformationForm;
