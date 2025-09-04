import React from 'react';
import { Card, CardContent } from '@/components/owner/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Eye, 
  MapPin, 
  Users, 
  Check, 
  MoreHorizontal,
  Home,
  Settings as SettingsIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPropertyType } from '@/lib/utils';

interface PropertyCardProps {
  property: any;
  packagesByProperty: Record<string, any[]>;
  onEdit: (property: any) => void;
  onView: (property: any, tab?: 'overview' | 'pricing' | 'rooms' | 'amenities' | 'policies' | 'location') => void;
  onEditDayPicnicPricing?: (property: any) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  packagesByProperty,
  onEdit,
  onView,
  onEditDayPicnicPricing
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "Active" },
      pending: { variant: "secondary" as const, label: "Pending" },
      inactive: { variant: "outline" as const, label: "Inactive" },
      rejected: { variant: "destructive" as const, label: "Rejected" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isDayPicnic = property.property_type === 'Day Picnic' || property.property_type === 'day-picnic';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-2 right-2">
          {getStatusBadge(property.status)}
        </div>
        
        {/* More Actions - Top Left */}
        <div className="absolute top-2 left-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onView(property)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
              {isDayPicnic && onEditDayPicnicPricing && (
                <DropdownMenuItem onClick={() => onEditDayPicnicPricing(property)}>
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Edit Pricing
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onView(property, 'location')}>
                <MapPin className="w-4 h-4 mr-2" />
                View Location
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        {/* Title and Type */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base truncate" title={property.title}>
            {property.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatPropertyType(property.property_type)}
          </p>
        </div>

        {/* Price and Capacity */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            ₹{property.pricing?.daily_rate || 0}
            <span className="text-sm font-normal text-muted-foreground">
              /{isDayPicnic ? 'day' : 'night'}
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            {isDayPicnic ? (
              `${property.day_picnic_capacity || property.max_guests || 0} guests`
            ) : (
              property.rooms_count && property.capacity_per_room ? (
                `${property.max_guests || 0} guests (${property.rooms_count} rooms)`
              ) : (
                `${property.max_guests || 0} guests`
              )
            )}
          </div>
        </div>

        {/* Day Picnic Inclusions */}
        {isDayPicnic && packagesByProperty[property.id] && (
          <div className="mt-3">
            {packagesByProperty[property.id].map((pkg, idx) => (
              <div key={idx}>
                {Array.isArray(pkg.displayInclusions) && pkg.displayInclusions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pkg.displayInclusions.slice(0, 2).map((inclusion: string, i: number) => (
                      <div key={i} className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                        <Check className="w-3 h-3 mr-1" />
                        <span className="truncate">{inclusion}</span>
                      </div>
                    ))}
                    {pkg.displayInclusions.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2 py-1">
                        +{pkg.displayInclusions.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(property)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(property)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};