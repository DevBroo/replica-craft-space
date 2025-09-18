import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomsUnitsProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const ROOM_TYPES = [
  'Single Room', 'Double Room', 'Twin Room', 'Triple Room', 'Quad Room',
  'Suite', 'Deluxe Room', 'Premium Room', 'Family Room', 'Connecting Rooms',
  'Dormitory', 'Private Room', 'Shared Room', 'Studio', 'Apartment'
];

const BED_TYPES = [
  'Single Bed', 'Double Bed', 'Queen Bed', 'King Bed', 'Twin Beds',
  'Bunk Bed', 'Sofa Bed', 'Murphy Bed', 'Daybed', 'Futon'
];

const ROOM_AMENITIES = [
  'Air Conditioning', 'Heating', 'Wi-Fi', 'TV', 'Smart TV', 'Minibar',
  'Coffee/Tea Maker', 'Safe', 'Balcony', 'City View', 'Garden View', 'Sea View',
  'Private Bathroom', 'Shared Bathroom', 'Bathtub', 'Shower', 'Hair Dryer',
  'Toiletries', 'Towels', 'Desk', 'Chair', 'Wardrobe', 'Iron', 'Kitchenette'
];

const RoomsUnits: React.FC<RoomsUnitsProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const { toast } = useToast();

  // Helper function to calculate total rooms from room types
  const calculateTotalRoomTypes = () => {
    return formData.rooms_details.types.reduce((total, room) => total + (room.count || 0), 0);
  };

  // Validation function
  const validateRoomCounts = () => {
    if (isDayPicnic) return true; // Skip validation for Day Picnic
    
    const totalRoomTypes = calculateTotalRoomTypes();
    const totalRooms = formData.rooms_count || 0;
    
    return totalRoomTypes === totalRooms;
  };

  // Get validation status for display
  const getRoomValidationStatus = () => {
    if (isDayPicnic) return null;
    
    const totalRoomTypes = calculateTotalRoomTypes();
    const totalRooms = formData.rooms_count || 0;
    const remaining = totalRooms - totalRoomTypes;
    
    return {
      totalRoomTypes,
      totalRooms,
      remaining,
      isValid: remaining === 0,
      isOverAllocated: remaining < 0
    };
  };

  const handleNext = () => {
    if (!isDayPicnic && !validateRoomCounts()) {
      const status = getRoomValidationStatus();
      if (status?.isOverAllocated) {
        toast({
          title: "Room Count Error",
          description: `You have allocated ${status.totalRoomTypes} rooms, but only ${status.totalRooms} rooms are available. Please reduce the room type counts.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Room Count Incomplete",
          description: `You need to allocate ${status?.remaining} more room${status?.remaining !== 1 ? 's' : ''} to match the total of ${status?.totalRooms} rooms.`,
          variant: "destructive"
        });
      }
      return;
    }
    onNext();
  };
  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rooms_details: { ...prev.rooms_details, [field]: value }
    }));
  };

  const addRoomType = () => {
    if(formData.property_type === 'villa') return
    const newRoomType = { type: '', count: 1, size: '', price_per_night: 0 };
    setFormData(prev => ({
      ...prev,
      rooms_details: {
        ...prev.rooms_details,
        types: [...prev.rooms_details.types, newRoomType]
      }
    }));
  };

  const updateRoomType = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rooms_details: {
        ...prev.rooms_details,
        types: prev.rooms_details.types.map((room, i) =>
          i === index ? { ...room, [field]: value } : room
        )
      }
    }));
  };

  const removeRoomType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rooms_details: {
        ...prev.rooms_details,
        types: prev.rooms_details.types.filter((_, i) => i !== index)
      }
    }));
  };

  const handleRoomAmenityToggle = (roomType: string, amenity: string) => {
    setFormData(prev => ({
      ...prev,
      rooms_details: {
        ...prev.rooms_details,
        amenities_per_room: {
          ...prev.rooms_details.amenities_per_room,
          [roomType]: prev.rooms_details.amenities_per_room[roomType]?.includes(amenity)
            ? prev.rooms_details.amenities_per_room[roomType].filter(a => a !== amenity)
            : [...(prev.rooms_details.amenities_per_room[roomType] || []), amenity]
        }
      }
    }));
  };

  const isDayPicnic = formData.property_type === 'Day Picnic';
  const roomValidationStatus = getRoomValidationStatus();

  return (
    <div className="space-y-6">
      {/* Basic Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isDayPicnic ? 'Day Picnic Capacity' : 'Basic Room Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDayPicnic ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="day_picnic_capacity">Maximum Guests for Day Picnic *</Label>
                <Input
                  id="day_picnic_capacity"
                  type="number"
                  min="1"
                  value={formData.day_picnic_capacity || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handleInputChange('day_picnic_capacity', value);
                    handleInputChange('max_guests', value);
                  }}
                  placeholder="Enter maximum capacity"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="day_picnic_duration">Duration Category</Label>
                <Select
                  value={formData.day_picnic_duration_category || ''}
                  onValueChange={(value) => handleInputChange('day_picnic_duration_category', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="half_day">Half Day (4-6 hours)</SelectItem>
                    <SelectItem value="full_day">Full Day (8-10 hours)</SelectItem>
                    <SelectItem value="extended_day">Extended Day (10+ hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="rooms_count">Number of Rooms *</Label>
                <Input
                  id="rooms_count"
                  type="number"
                  min="1"
                  value={formData.rooms_count}
                  onChange={(e) => handleInputChange('rooms_count', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="capacity_per_room">Capacity per Room *</Label>
                <Input
                  id="capacity_per_room"
                  type="number"
                  min="1"
                  value={formData.capacity_per_room}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    handleInputChange('capacity_per_room', value);
                    handleInputChange('max_guests', formData.rooms_count * value);
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">
              Total Maximum Guests: {formData.max_guests}
            </div>
            <div className="text-xs text-muted-foreground">
              {isDayPicnic 
                ? 'This is the maximum number of guests for day picnic activities'
                : `Calculated as ${formData.rooms_count} rooms × ${formData.capacity_per_room} guests per room`
              }
            </div>
            
            {/* Room Allocation Status */}
            {roomValidationStatus && (
              <div className={`flex items-center gap-2 mt-2 p-2 rounded text-xs ${
                roomValidationStatus.isValid 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : roomValidationStatus.isOverAllocated
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                {roomValidationStatus.isValid ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Room allocation complete: {roomValidationStatus.totalRoomTypes} of {roomValidationStatus.totalRooms} rooms configured</span>
                  </>
                ) : roomValidationStatus.isOverAllocated ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Over-allocated: {roomValidationStatus.totalRoomTypes} rooms configured, only {roomValidationStatus.totalRooms} available</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Incomplete: {roomValidationStatus.totalRoomTypes} of {roomValidationStatus.totalRooms} rooms configured ({Math.abs(roomValidationStatus.remaining)} more needed)</span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!isDayPicnic && (
        <>
          {/* Detailed Room Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Room Types & Configurations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Define different room types available in your property
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.rooms_details.types.map((room, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Room Type {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoomType(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <div>
                       <Label>Room Type</Label>
                       <Select
                         value={room.type}
                         onValueChange={(value) => updateRoomType(index, 'type', value)}
                       >
                         <SelectTrigger className="mt-1">
                           <SelectValue placeholder="Select room type" />
                         </SelectTrigger>
                         <SelectContent>
                           {ROOM_TYPES.map(type => (
                             <SelectItem key={type} value={type}>{type}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>

                     <div>
                       <Label>Number of This Type</Label>
                       <Input
                         type="number"
                         min="1"
                         value={room.count}
                         onChange={(e) => updateRoomType(index, 'count', parseInt(e.target.value) || 1)}
                         className="mt-1"
                       />
                     </div>

                     <div>
                       <Label>Price per Night *</Label>
                       <div className="relative mt-1">
                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                         <Input
                           type="number"
                           min="0"
                           value={room.price_per_night || 0}
                           onChange={(e) => updateRoomType(index, 'price_per_night', parseInt(e.target.value) || 0)}
                           className="pl-8"
                           placeholder="500"
                         />
                       </div>
                     </div>

                     <div>
                       <Label>Room Size (optional)</Label>
                       <Input
                         value={room.size || ''}
                         onChange={(e) => updateRoomType(index, 'size', e.target.value)}
                         placeholder="e.g., 25 sq.m"
                         className="mt-1"
                       />
                     </div>
                   </div>

                  {/* Room-specific amenities */}
                  {room.type && (
                    <div>
                      <Label className="text-sm">Amenities for {room.type}</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ROOM_AMENITIES.map(amenity => (
                          <Badge
                            key={amenity}
                            variant={
                              formData.rooms_details.amenities_per_room[room.type]?.includes(amenity) 
                                ? "default" 
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                            onClick={() => handleRoomAmenityToggle(room.type, amenity)}
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button disabled={formData.property_type === 'villa'} variant="outline" onClick={addRoomType} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Room Type
              </Button>
            </CardContent>
          </Card>

          {/* Bed Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bed Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {BED_TYPES.map(bedType => (
                  <div key={bedType}>
                    <Label className="text-sm">{bedType}</Label>
                    <Input
                      type="number"
                      min="0"
                      defaultValue="0"
                      placeholder="0"
                      className="mt-1"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          bed_configuration: {
                            ...prev.bed_configuration,
                            beds: {
                              ...(prev.bed_configuration as any)?.beds,
                              [bedType]: value
                            }
                          }
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!isDayPicnic && !validateRoomCounts()}
          className={!isDayPicnic && !validateRoomCounts() ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default RoomsUnits;