import React, { useState } from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Input } from '@/components/owner/ui/input';
import { Label } from '@/components/owner/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/owner/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { ArrowLeft, ArrowRight, MapPin, Car, Plane, Train, Plus, Trash2, Utensils, Camera, ShoppingBag } from 'lucide-react';

interface LocationNearbyProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const LANDMARK_TYPES = [
  'Historical Site', 'Religious Site', 'Museum', 'Monument', 'Park', 'Beach', 'Mountain',
  'Lake', 'River', 'Shopping Mall', 'Market', 'Hospital', 'School', 'University',
  'Government Office', 'Tourist Attraction', 'Entertainment Complex', 'Sports Complex'
];

const CUISINE_TYPES = [
  'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai', 'Japanese',
  'Fast Food', 'Street Food', 'Vegetarian', 'Vegan', 'Multi-cuisine', 'Regional Specialty'
];

const ENTERTAINMENT_TYPES = [
  'Cinema', 'Theater', 'Club', 'Bar', 'Live Music', 'Cultural Center', 'Art Gallery',
  'Sports Club', 'Gaming Zone', 'Adventure Sports', 'Water Park', 'Amusement Park'
];

const TRANSPORT_TYPES = [
  'Airport', 'Railway Station', 'Bus Station', 'Metro Station', 'Taxi Stand',
  'Car Rental', 'Bike Rental', 'Public Transport Hub'
];

const LocationNearby: React.FC<LocationNearbyProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const [newLandmark, setNewLandmark] = useState({ name: '', distance: '', type: 'Tourist Attraction' });
  const [newDining, setNewDining] = useState({ name: '', cuisine: 'Multi-cuisine', distance: '' });
  const [newEntertainment, setNewEntertainment] = useState({ name: '', type: 'Cinema', distance: '' });

  const handleNearbyAttractionsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: { ...prev.nearby_attractions, [field]: value }
    }));
  };

  const handleDistancesChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        distances: { ...prev.nearby_attractions.distances, [key]: value }
      }
    }));
  };

  const handleTransportChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        transport: { ...prev.nearby_attractions.transport, [key]: value }
      }
    }));
  };

  const addLandmark = () => {
    if (!newLandmark.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        landmarks: [...prev.nearby_attractions.landmarks, { ...newLandmark }]
      }
    }));
    
    setNewLandmark({ name: '', distance: '', type: 'Tourist Attraction' });
  };

  const removeLandmark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        landmarks: prev.nearby_attractions.landmarks.filter((_, i) => i !== index)
      }
    }));
  };

  const addDining = () => {
    if (!newDining.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        dining: [...prev.nearby_attractions.dining, { ...newDining }]
      }
    }));
    
    setNewDining({ name: '', cuisine: 'Multi-cuisine', distance: '' });
  };

  const removeDining = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        dining: prev.nearby_attractions.dining.filter((_, i) => i !== index)
      }
    }));
  };

  const addEntertainment = () => {
    if (!newEntertainment.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        entertainment: [...prev.nearby_attractions.entertainment, { ...newEntertainment }]
      }
    }));
    
    setNewEntertainment({ name: '', type: 'Cinema', distance: '' });
  };

  const removeEntertainment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearby_attractions: {
        ...prev.nearby_attractions,
        entertainment: prev.nearby_attractions.entertainment.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Transportation & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Car className="w-5 h-5 mr-2" />
            Transportation & Access
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Help guests understand how to reach your property and get around the area
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="airport_distance">Nearest Airport</Label>
              <Input
                id="airport_distance"
                value={formData.nearby_attractions.distances.airport || ''}
                onChange={(e) => handleDistancesChange('airport', e.target.value)}
                placeholder="e.g., Mumbai Airport - 15 km"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="railway_distance">Nearest Railway Station</Label>
              <Input
                id="railway_distance"
                value={formData.nearby_attractions.distances.railway || ''}
                onChange={(e) => handleDistancesChange('railway', e.target.value)}
                placeholder="e.g., Central Station - 5 km"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bus_distance">Nearest Bus Stand</Label>
              <Input
                id="bus_distance"
                value={formData.nearby_attractions.distances.bus || ''}
                onChange={(e) => handleDistancesChange('bus', e.target.value)}
                placeholder="e.g., City Bus Stand - 2 km"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shuttle_service">Airport Shuttle Service</Label>
              <Select
                value={formData.nearby_attractions.transport.shuttle || ''}
                onValueChange={(value) => handleTransportChange('shuttle', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select shuttle availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free shuttle provided</SelectItem>
                  <SelectItem value="paid">Paid shuttle available</SelectItem>
                  <SelectItem value="on_request">Available on request</SelectItem>
                  <SelectItem value="none">No shuttle service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="parking_info">Parking Information</Label>
              <Select
                value={formData.nearby_attractions.transport.parking || ''}
                onValueChange={(value) => handleTransportChange('parking', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select parking details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free parking available</SelectItem>
                  <SelectItem value="paid">Paid parking available</SelectItem>
                  <SelectItem value="street">Street parking only</SelectItem>
                  <SelectItem value="none">No parking available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Landmarks & Attractions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Nearby Landmarks & Attractions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new landmark */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Landmark Name</Label>
              <Input
                value={newLandmark.name}
                onChange={(e) => setNewLandmark(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter landmark name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={newLandmark.type}
                onValueChange={(value) => setNewLandmark(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANDMARK_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distance</Label>
              <Input
                value={newLandmark.distance}
                onChange={(e) => setNewLandmark(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="e.g., 2 km, 10 min walk"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addLandmark} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Display landmarks */}
          {formData.nearby_attractions.landmarks.length > 0 && (
            <div className="space-y-2">
              {formData.nearby_attractions.landmarks.map((landmark, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{landmark.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{landmark.type}</Badge>
                      {landmark.distance}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLandmark(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dining Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Utensils className="w-5 h-5 mr-2" />
            Nearby Dining Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new dining option */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Restaurant Name</Label>
              <Input
                value={newDining.name}
                onChange={(e) => setNewDining(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter restaurant name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cuisine Type</Label>
              <Select
                value={newDining.cuisine}
                onValueChange={(value) => setNewDining(prev => ({ ...prev, cuisine: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distance</Label>
              <Input
                value={newDining.distance}
                onChange={(e) => setNewDining(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="e.g., 500m, 5 min walk"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDining} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Display dining options */}
          {formData.nearby_attractions.dining.length > 0 && (
            <div className="space-y-2">
              {formData.nearby_attractions.dining.map((restaurant, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{restaurant.cuisine}</Badge>
                      {restaurant.distance}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDining(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entertainment & Recreation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Entertainment & Recreation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new entertainment option */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Entertainment Venue</Label>
              <Input
                value={newEntertainment.name}
                onChange={(e) => setNewEntertainment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter venue name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={newEntertainment.type}
                onValueChange={(value) => setNewEntertainment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTERTAINMENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distance</Label>
              <Input
                value={newEntertainment.distance}
                onChange={(e) => setNewEntertainment(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="e.g., 1 km, 15 min walk"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addEntertainment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Display entertainment options */}
          {formData.nearby_attractions.entertainment.length > 0 && (
            <div className="space-y-2">
              {formData.nearby_attractions.entertainment.map((venue, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{venue.type}</Badge>
                      {venue.distance}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntertainment(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.nearby_attractions.landmarks.length}
              </div>
              <div className="text-sm text-muted-foreground">Landmarks</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.nearby_attractions.dining.length}
              </div>
              <div className="text-sm text-muted-foreground">Dining Options</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.nearby_attractions.entertainment.length}
              </div>
              <div className="text-sm text-muted-foreground">Entertainment</div>
            </div>
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

export default LocationNearby;