import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OfficeLocation {
  city: string;
  address: string;
  phone: string;
  hours: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface InteractiveMapProps {
  offices: OfficeLocation[];
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ offices, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [77.5946, 20.9629], // Center of India
        zoom: 4.5,
        projection: 'mercator'
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true
        }),
        'top-right'
      );

      // Add markers for each office
      offices.forEach((office) => {
        if (!map.current) return;

        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.style.cssText = `
          width: 40px;
          height: 40px;
          background: hsl(var(--primary));
          border: 3px solid hsl(var(--background));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary-foreground));
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s ease;
        `;
        markerElement.textContent = office.city.charAt(0);

        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.1)';
          markerElement.style.boxShadow = '0 6px 20px hsl(var(--primary) / 0.4)';
        });
        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
          markerElement.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.3)';
        });

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'p-4';
        popupContent.innerHTML = `
          <div class="space-y-2">
            <h3 class="font-semibold text-lg text-foreground">${office.city} Office</h3>
            <p class="text-sm text-muted-foreground">${office.address}</p>
            <p class="text-sm text-muted-foreground">📞 ${office.phone}</p>
            <p class="text-sm text-muted-foreground">🕒 ${office.hours}</p>
            <button 
              class="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
              onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(office.address + ', ' + office.city)}', '_blank')"
            >
              Get Directions
            </button>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          className: 'custom-popup'
        }).setDOMContent(popupContent);

        // Create marker and add to map
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat(office.coordinates)
          .setPopup(popup)
          .addTo(map.current);

        // Show popup on marker click
        markerElement.addEventListener('click', () => {
          popup.addTo(map.current!);
        });
      });

      // Fit map to show all markers
      if (offices.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        offices.forEach(office => bounds.extend(office.coordinates));
        map.current.fitBounds(bounds, { padding: 50 });
      }

      setShowTokenInput(false);
      setIsLoading(false);
      toast.success('Map loaded successfully!');
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to load map. Please check your API key.');
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      toast.error('Please enter a valid Mapbox token');
      return;
    }
    setIsLoading(true);
    initializeMap(mapboxToken);
  };

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (showTokenInput) {
    return (
      <div className={`relative w-full h-[400px] bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6 max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Mapbox public token to view our office locations on an interactive map.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Get your free token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleTokenSubmit}
              disabled={isLoading || !mapboxToken.trim()}
              className="w-full"
            >
              {isLoading ? 'Loading Map...' : 'Load Map'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[400px] rounded-lg overflow-hidden shadow-lg ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <style>{`
        .custom-popup .mapboxgl-popup-content {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 10px 25px hsl(var(--foreground) / 0.1);
          padding: 0;
        }
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: hsl(var(--background));
        }
        .mapboxgl-popup-close-button {
          color: hsl(var(--muted-foreground));
          font-size: 18px;
          padding: 8px;
        }
        .mapboxgl-popup-close-button:hover {
          color: hsl(var(--foreground));
          background: hsl(var(--muted));
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;