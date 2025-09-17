import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface RoomCardProps {
  room: {
    id?: string;
    name: string;
    images?: string[];
    max_guests?: number;
    amenities?: string[];
    refundable?: boolean;
    price: number;
    features?: string[];
  };
  onSelect: (room: any) => void;
  isSelected?: boolean;
  room_details?: any[];
  isVilla?: boolean;
  selectedRoom?: any;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onSelect,
  isSelected = false,
  room_details,
  isVilla,
  selectedRoom,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use room images or fallback to placeholder
  const images =
    room.images && room.images.length > 0 ? room.images : ["/placeholder.svg"];
  const amenities = room.amenities || room.features || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <TooltipProvider>
      <Card
        className={`transition-all hover:shadow-md ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Image carousel */}
            <div className="flex-1 relative w-full md:w-64 h-64 bg-muted">
              <img
                src={getOptimizedImageUrl(images[currentImageIndex], {
                  width: 300,
                  height: 200,
                })}
                alt={room.name}
                className="w-full h-full object-cover"
              />

              {/* Navigation arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <Button
                    onClick={prevImage}
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={nextImage}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Refundable badge */}
              {room.refundable && (
                <Badge className="absolute top-2 left-2 bg-green-600">
                  Refundable
                </Badge>
              )}

              {/* Max Guests */}
              {!isVilla && (
                <div className="m-4">
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {amenities.slice(0, 4).map((amenity, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {typeof amenity === "string" ? amenity : amenity}
                        </Badge>
                      ))}
                      {amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{amenities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Room details */}
            <div className="w-3/5 flex flex-col">
              {room_details ? (
                room_details.map((detail: any) => (
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {detail.type}
                        </h3>

                        {detail.count && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <Users className="h-4 w-4" />
                            Max {detail.count * 2} guests
                          </div>
                        )}

                        {/* Amenities chips */}
                        {detail.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {detail.amenities
                              .slice(0, 3)
                              .map((amenity, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {typeof amenity === "string"
                                    ? amenity
                                    : amenity}
                                </Badge>
                              ))}
                            {detail.amenities.length > 3 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs">
                                    +{detail.amenities.length - 3} more
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="flex flex-col gap-2">
                                    {detail.amenities
                                      .slice(3)
                                      .map((amenity, index) => (
                                        <p key={index} className="text-xs">
                                          {typeof amenity === "string"
                                            ? amenity
                                            : amenity}
                                        </p>
                                      ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ₹{detail.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per night
                        </div>
                      </div>
                    </div>

                    {/* Select button */}
                    <Button
                      onClick={() => onSelect(detail)}
                      className="w-full"
                      variant={
                        selectedRoom?.some((r) => r.type === detail?.type)
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedRoom?.some((r) => r.type === detail?.type)
                        ? "Unselect Room"
                        : "Select Room"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {room.name}
                      </h3>

                      {/* Max guests */}
                      {room.max_guests && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <Users className="h-4 w-4" />
                          Max {room.max_guests} guests
                        </div>
                      )}

                      {/* Amenities chips */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {amenities.slice(0, 4).map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {typeof amenity === "string" ? amenity : amenity}
                            </Badge>
                          ))}
                          {amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="text-right">
                      <div className="text-2xl font-bold">₹{room.price}</div>
                      <div className="text-sm text-muted-foreground">
                        per night
                      </div>
                    </div>
                  </div>

                  {/* Select button */}
                  <Button
                    onClick={() => onSelect(room)}
                    className="w-full"
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isSelected ? "Unselect Room" : "Select Room"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
