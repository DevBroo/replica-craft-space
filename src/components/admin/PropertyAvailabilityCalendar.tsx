
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BookingPopupModal from './BookingPopupModal';

interface AvailabilityEntry {
  id?: string;
  day: string;
  category: 'rooms' | 'day_picnic' | 'banquet_hall' | 'ground_lawn';
  total_capacity: number;
  booked_units: number;
  status: 'available' | 'partial' | 'booked' | 'blocked';
  booking_name?: string;
}

interface PropertyAvailabilityCalendarProps {
  propertyId: string | null;
}

const PropertyAvailabilityCalendar: React.FC<PropertyAvailabilityCalendarProps> = ({
  propertyId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'rooms' | 'day_picnic' | 'banquet_hall' | 'ground_lawn'>('rooms');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const categories = [
    { value: 'rooms' as const, label: 'Rooms' },
    { value: 'day_picnic' as const, label: 'Day Picnic' },
    { value: 'banquet_hall' as const, label: 'Banquet Hall' },
    { value: 'ground_lawn' as const, label: 'Ground/Lawn' },
  ];

  useEffect(() => {
    if (propertyId) {
      fetchAvailability();
    }
  }, [propertyId, currentDate, selectedCategory]);

  const fetchAvailability = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Try to fetch from property_availability table, gracefully handle if it doesn't exist
      const { data, error } = await supabase
        .from('property_availability' as any)
        .select('*')
        .eq('property_id', propertyId)
        .eq('category', selectedCategory)
        .gte('day', startDate.toISOString().split('T')[0])
        .lte('day', endDate.toISOString().split('T')[0])
        .order('day', { ascending: true });

      if (error) {
        console.log('Property availability table not available:', error);
        setAvailability([]);
      } else if (data && Array.isArray(data)) {
        // Type cast to handle the new table structure
        const mappedData: AvailabilityEntry[] = data.map((item: any) => ({
          id: item.id || '',
          day: item.day || '',
          category: item.category || 'rooms',
          total_capacity: item.total_capacity || 0,
          booked_units: item.booked_units || 0,
          status: item.status || 'available',
          booking_name: item.booking_name || undefined
        }));
        setAvailability(mappedData);
      } else {
        setAvailability([]);
      }
    } catch (error) {
      console.log('Property availability table not available:', error);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAvailabilityForDate = (date: Date): AvailabilityEntry | null => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(entry => entry.day === dateStr) || null;
  };

  const updateAvailability = async (date: Date, updates: Partial<AvailabilityEntry>) => {
    if (!propertyId) return;

    const dateStr = date.toISOString().split('T')[0];
    const existingEntry = getAvailabilityForDate(date);

    try {
      if (existingEntry?.id) {
        // Update existing entry
        const { error } = await supabase
          .from('property_availability' as any)
          .update(updates)
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('property_availability' as any)
          .insert({
            property_id: propertyId,
            day: dateStr,
            category: selectedCategory,
            total_capacity: updates.total_capacity || 1,
            booked_units: updates.booked_units || 0,
            status: updates.status || 'available',
            booking_name: updates.booking_name,
          });

        if (error) throw error;
      }

      await fetchAvailability();
      toast.success('Availability updated successfully');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability. Table may not be available yet.');
    }
  };

  const openBookingModal = (date: Date) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedDate(null);
  };

  const blockDate = async (date: Date) => {
    await updateAvailability(date, {
      status: 'blocked',
      total_capacity: 1,
      booked_units: 1,
      booking_name: 'Admin Blocked'
    });
  };

  const unblockDate = async (date: Date) => {
    await updateAvailability(date, {
      status: 'available',
      total_capacity: 1,
      booked_units: 0,
      booking_name: undefined
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const days = getDaysInMonth(currentDate);

  const getStatusColor = (entry: AvailabilityEntry | null) => {
    if (!entry) return 'bg-gray-50 text-gray-900';
    
    switch (entry.status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'blocked':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-50 text-gray-900';
    }
  };

  if (!propertyId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No property selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Availability Calendar</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-lg font-semibold">{monthYear}</h4>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-20"></div>;
              }

              const entry = getAvailabilityForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`h-20 border rounded-md p-1 text-xs ${getStatusColor(entry)} ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="font-medium">{date.getDate()}</div>
                  {entry && (
                    <div className="mt-1">
                      <div>{entry.booked_units}/{entry.total_capacity}</div>
                      {entry.booking_name && (
                        <div className="truncate">{entry.booking_name}</div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <button
                      onClick={() => openBookingModal(date)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      title="Add booking"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {entry?.status === 'blocked' ? (
                      <button
                        onClick={() => unblockDate(date)}
                        className="text-green-600 hover:text-green-800 text-xs"
                        title="Unblock date"
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => blockDate(date)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Block date"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 rounded mr-1"></div>
              <span>Partial</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDate && propertyId && (
        <BookingPopupModal
          isOpen={showBookingModal}
          onClose={closeBookingModal}
          propertyId={propertyId}
          selectedDate={selectedDate}
          selectedCategory={selectedCategory}
          onBookingComplete={() => {
            fetchAvailability();
            closeBookingModal();
          }}
        />
      )}
    </div>
  );
};

export default PropertyAvailabilityCalendar;
