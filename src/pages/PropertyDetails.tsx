import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Wifi, Car, Utensils, Waves, Heart, Share2, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Comprehensive dummy data for properties
const propertyData = {
  "1": {
    id: "1",
    title: "Beachside Paradise Resort",
    location: "Maldives",
    price: 450,
    rating: 4.9,
    reviews: 128,
    images: [
      "/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png",
      "/lovable-uploads/e228e944-68b4-44be-b2e6-34da27786e7b.png",
      "/lovable-uploads/4a6c26a9-df9d-4bbe-a6d2-acb1b3d99100.png",
      "/lovable-uploads/f5331113-f11c-4b8a-93ba-4f472bf22f0a.png"
    ],
    description: "Experience pure luxury at our stunning beachside resort. Wake up to pristine white sand beaches and crystal-clear turquoise waters. This premium property offers world-class amenities, exceptional service, and breathtaking ocean views that will make your stay unforgettable.",
    amenities: [
      { icon: Wifi, name: "Free WiFi" },
      { icon: Car, name: "Free Parking" },
      { icon: Utensils, name: "Restaurant" },
      { icon: Waves, name: "Private Beach" }
    ],
    roomTypes: [
      {
        name: "Ocean View Suite",
        price: 450,
        features: ["King Bed", "Ocean View", "Private Balcony", "Minibar"]
      },
      {
        name: "Beach Villa",
        price: 650,
        features: ["2 Bedrooms", "Direct Beach Access", "Private Pool", "Butler Service"]
      }
    ],
    highlights: [
      "Direct beach access",
      "World-class spa services",
      "Multiple dining options",
      "Water sports activities",
      "24/7 concierge service"
    ]
  },
  "2": {
    id: "2",
    title: "Mountain Cottage Retreat",
    location: "Swiss Alps",
    price: 320,
    rating: 4.7,
    reviews: 89,
    images: [
      "/lovable-uploads/e228e944-68b4-44be-b2e6-34da27786e7b.png",
      "/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png",
      "/lovable-uploads/4a6c26a9-df9d-4bbe-a6d2-acb1b3d99100.png"
    ],
    description: "Escape to our charming mountain cottage nestled in the heart of the Swiss Alps. Surrounded by snow-capped peaks and pristine forests, this cozy retreat offers the perfect blend of rustic charm and modern comfort.",
    amenities: [
      { icon: Wifi, name: "Free WiFi" },
      { icon: Car, name: "Free Parking" },
      { icon: Utensils, name: "Kitchenette" }
    ],
    roomTypes: [
      {
        name: "Alpine Suite",
        price: 320,
        features: ["Queen Bed", "Mountain View", "Fireplace", "Kitchenette"]
      }
    ],
    highlights: [
      "Mountain hiking trails",
      "Ski resort nearby",
      "Cozy fireplace",
      "Spectacular views",
      "Pet-friendly"
    ]
  },
  "3": {
    id: "3",
    title: "Lakeside Retreat Villa",
    location: "Lake Como, Italy",
    price: 380,
    rating: 4.8,
    reviews: 156,
    images: [
      "/lovable-uploads/4a6c26a9-df9d-4bbe-a6d2-acb1b3d99100.png",
      "/lovable-uploads/f5331113-f11c-4b8a-93ba-4f472bf22f0a.png",
      "/lovable-uploads/f7960b1f-407a-4738-b8f6-067ea4600889.png"
    ],
    description: "Discover tranquility at our luxurious lakeside villa overlooking the stunning Lake Como. This elegant property combines Italian sophistication with breathtaking natural beauty, offering an unforgettable romantic getaway.",
    amenities: [
      { icon: Wifi, name: "Free WiFi" },
      { icon: Car, name: "Valet Parking" },
      { icon: Utensils, name: "Fine Dining" },
      { icon: Waves, name: "Lake Access" }
    ],
    roomTypes: [
      {
        name: "Lake View Room",
        price: 380,
        features: ["King Bed", "Lake View", "Marble Bathroom", "Balcony"]
      }
    ],
    highlights: [
      "Private lake access",
      "Italian gardens",
      "Boat rental available",
      "Wine tasting",
      "Spa treatments"
    ]
  }
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [guests, setGuests] = useState(2);
  
  // Load venteskraft properties from localStorage
  const getVenteskraftProperties = () => {
    try {
      const storageKey = 'properties_venteskraft@gmail.com';
      const savedProperties = localStorage.getItem(storageKey);
      if (savedProperties) {
        const parsedProperties = JSON.parse(savedProperties);
        return parsedProperties.filter((property: any) => property.status === 'active');
      }
    } catch (error) {
      console.log('Error loading venteskraft properties:', error);
    }
    return [];
  };

  const venteskraftProperties = getVenteskraftProperties();
  
  // Check if it's a venteskraft property first
  const venteskraftProperty = venteskraftProperties.find((p: any) => p.id === id);
  
  // If not found in venteskraft properties, check the dummy data
  const property = venteskraftProperty ? {
    id: venteskraftProperty.id,
    title: venteskraftProperty.name,
    location: `${venteskraftProperty.city}, ${venteskraftProperty.state}`,
    price: venteskraftProperty.price,
    rating: venteskraftProperty.rating,
    reviews: venteskraftProperty.totalBookings,
    images: venteskraftProperty.images && venteskraftProperty.images.length > 0 
      ? venteskraftProperty.images 
      : ['/placeholder.svg'],
    description: venteskraftProperty.description || 'No description available.',
    amenities: venteskraftProperty.amenities.map((a: string) => ({ 
      icon: Wifi, 
      name: a.charAt(0).toUpperCase() + a.slice(1) 
    })),
    roomTypes: [
      {
        name: `${venteskraftProperty.type.charAt(0).toUpperCase() + venteskraftProperty.type.slice(1)} Room`,
        price: venteskraftProperty.price,
        features: [`${venteskraftProperty.bedrooms} Bedrooms`, `${venteskraftProperty.bathrooms} Bathrooms`, `Capacity: ${venteskraftProperty.capacity} guests`]
      }
    ],
    highlights: [
      `${venteskraftProperty.bedrooms} Bedrooms`,
      `${venteskraftProperty.bathrooms} Bathrooms`,
      `Capacity: ${venteskraftProperty.capacity} guests`,
      `${venteskraftProperty.type.charAt(0).toUpperCase() + venteskraftProperty.type.slice(1)} Type`,
      'Active Property'
    ]
  } : propertyData[id as keyof typeof propertyData];
  
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{property.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location}
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {property.rating} ({property.reviews} reviews)
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative h-96 rounded-lg overflow-hidden mb-4">
                <img 
                  src={property.images[currentImageIndex]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {property.images.slice(0, 4).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-20 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About this place</h2>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </div>

            {/* Highlights */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                    <amenity.icon className="w-5 h-5 mr-2 text-primary" />
                    <span className="text-sm">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Types */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Room Options</h2>
              <div className="space-y-4">
                {property.roomTypes.map((room, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold">{room.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">${room.price}</div>
                          <div className="text-sm text-muted-foreground">per night</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">
                    ${property.price}
                  </div>
                  <div className="text-sm text-muted-foreground">per night</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in / Check-out</label>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Select dates
                    </Button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Guests</label>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{guests} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                        >
                          -
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setGuests(guests + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mb-4">
                  Reserve Now
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  You won't be charged yet
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span>${property.price} × 5 nights</span>
                    <span>${property.price * 5}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span>Service fee</span>
                    <span>${Math.round(property.price * 5 * 0.1)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>${property.price * 5 + Math.round(property.price * 5 * 0.1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;