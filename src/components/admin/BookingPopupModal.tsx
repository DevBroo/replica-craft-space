import React, { useState } from 'react';
import { X, Calendar, Users, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  selectedDate: Date;
  selectedCategory: 'rooms' | 'day_picnic' | 'banquet_hall' | 'ground_lawn';
  onBookingComplete: () => void;
}

const BookingPopupModal: React.FC<BookingPopupModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  selectedDate,
  selectedCategory,
  onBookingComplete,
}) => {
  const [bookingName, setBookingName] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [roomsCount, setRoomsCount] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingName.trim()) {
      toast.error('Please provide a booking name');
      return;
    }

    setLoading(true);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const units = selectedCategory === 'rooms' ? roomsCount : peopleCount;
      const capacity = selectedCategory === 'banquet_hall' ? 1 : units;

      // Create or update availability entry
      const { error } = await supabase
        .from('property_availability')
        .upsert({
          property_id: propertyId,
          day: dateStr,
          category: selectedCategory,
          total_capacity: capacity,
          booked_units: units,
          status: units >= capacity ? 'booked' : 'partial',
          booking_name: bookingName,
        });

      if (error) throw error;

      toast.success('Booking created successfully');
      onBookingComplete();
      onClose();
      
      // Reset form
      setBookingName('');
      setPeopleCount(1);
      setRoomsCount(1);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setBookingName('');
      setPeopleCount(1);
      setRoomsCount(1);
      onClose();
    }
  };

  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case 'rooms': return 'Rooms';
      case 'day_picnic': return 'Day Picnic';
      case 'banquet_hall': return 'Banquet Hall';
      case 'ground_lawn': return 'Ground/Lawn';
      default: return selectedCategory;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            Manage Availability
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium">Category</label>
                <p className="text-gray-900">{getCategoryLabel()}</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Date</label>
                <p className="text-gray-900">{selectedDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="bookingName" className="block text-sm font-medium text-gray-700 mb-1">
              Booking Name / Event Name *
            </label>
            <input
              type="text"
              id="bookingName"
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter booking or event name"
              required
              disabled={loading}
            />
          </div>

          {selectedCategory === 'rooms' ? (
            <div className="mb-6">
              <label htmlFor="roomsCount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Number of Rooms Required *
              </label>
              <input
                type="number"
                id="roomsCount"
                min="1"
                value={roomsCount}
                onChange={(e) => setRoomsCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          ) : (
            <div className="mb-6">
              <label htmlFor="peopleCount" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Number of People *
              </label>
              <input
                type="number"
                id="peopleCount"
                min="1"
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPopupModal;