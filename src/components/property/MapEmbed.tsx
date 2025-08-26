import React from 'react';
import { MapPin, Train, Plane } from 'lucide-react';

interface MapEmbedProps {
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  address?: string;
}

export const MapEmbed: React.FC<MapEmbedProps> = ({
  city,
  state,
  coordinates,
  address
}) => {
  // Generate map URL
  const getMapUrl = () => {
    if (coordinates) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOMD0C6DfYtbFo&q=${coordinates.lat},${coordinates.lng}&zoom=15`;
    }
    
    const location = address || `${city}, ${state}` || 'India';
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOMD0C6DfYtbFo&q=${encodeURIComponent(location)}&zoom=13`;
  };

  // Mock distance calculations (in real app, these would come from APIs)
  const getDistances = () => {
    return [
      {
        icon: MapPin,
        label: 'City Center',
        distance: '12 km',
        time: '20 min drive'
      },
      {
        icon: Train,
        label: 'Railway Station',
        distance: '8 km',
        time: '15 min drive'
      },
      {
        icon: Plane,
        label: 'Airport',
        distance: '45 km',
        time: '1 hour drive'
      }
    ];
  };

  const distances = getDistances();
  const locationText = address || `${city}, ${state}` || 'Location';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Location</h3>
        <p className="text-muted-foreground mb-4">
          Find us at {locationText}
        </p>
      </div>

      {/* Map iframe */}
      <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
        <iframe
          src={getMapUrl()}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Property Location"
          className="absolute inset-0"
        />
      </div>

      {/* Distances */}
      <div className="space-y-4">
        <h4 className="font-semibold">Nearby Landmarks</h4>
        <div className="grid gap-3">
          {distances.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{item.distance}</div>
                  <div className="text-muted-foreground">{item.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};