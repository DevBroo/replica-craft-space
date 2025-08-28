
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvailabilityEntry {
  id: string;
  day: string;
  category: string;
  total_capacity: number | null;
  booked_units: number;
  status: string;
  booking_name: string | null;
  quantity: number | null;
  notes: string | null;
}

interface PropertyAvailabilityCalendarProps {
  propertyId: string;
  isAdminOverride?: boolean;
}

const CATEGORIES = [
  { key: 'rooms', name: 'Rooms', icon: '🏠' },
  { key: 'day_picnic', name: 'Day Picnic', icon: '🧺' },
  { key: 'banquet_hall', name: 'Banquet Hall', icon: '🏛️' },
  { key: 'ground_lawn', name: 'Ground/Lawn', icon: '🌿' },
];

const PropertyAvailabilityCalendar: React.FC<PropertyAvailabilityCalendarProps> = ({
  propertyId,
  isAdminOverride = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('rooms');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<AvailabilityEntry | null>(null);

  // Form states
  const [bookingName, setBookingName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState('booked');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, [propertyId, currentMonth, selectedCategory]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('property_availability')
        .select('*')
        .eq('property_id', propertyId)
        .eq('category', selectedCategory)
        .gte('day', startDate.toISOString().split('T')[0])
        .lte('day', endDate.toISOString().split('T')[0])
        .order('day');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to fetch availability data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.day === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existing = getAvailabilityForDate(date);
    
    setSelectedDate(dateStr);
    setEditingEntry(existing || null);
    
    if (existing) {
      setBookingName(existing.booking_name || '');
      setQuantity(existing.quantity || 0);
      setStatus(existing.status);
      setNotes(existing.notes || '');
    } else {
      setBookingName('');
      setQuantity(0);
      setStatus('booked');
      setNotes('');
    }
    
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    
    try {
      const data = {
        property_id: propertyId,
        day: selectedDate,
        category: selectedCategory,
        booking_name: bookingName || null,
        quantity: quantity || null,
        status,
        notes: notes || null,
        booked_units: quantity || 0,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('property_availability')
          .update(data)
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast.success('Availability updated successfully');
      } else {
        const { error } = await supabase
          .from('property_availability')
          .insert(data);
        
        if (error) throw error;
        toast.success('Availability entry created successfully');
      }
      
      setShowModal(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    
    try {
      const { error } = await supabase
        .from('property_availability')
        .delete()
        .eq('id', editingEntry.id);
      
      if (error) throw error;
      toast.success('Availability entry deleted successfully');
      setShowModal(false);
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast.error('Failed to delete availability');
    }
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="flex space-x-2 mb-4">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              selectedCategory === category.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2"></div>;
          }
          
          const availability = getAvailabilityForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`p-2 min-h-[60px] border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <div className="text-sm font-medium">{date.getDate()}</div>
              {availability && (
                <div className={`text-xs px-1 py-0.5 rounded mt-1 ${getStatusColor(availability.status)}`}>
                  {availability.booking_name || availability.status}
                  {availability.quantity && (
                    <div className="text-xs">({availability.quantity})</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingEntry ? 'Edit' : 'Add'} Availability - {selectedDate}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={CATEGORIES.find(c => c.key === selectedCategory)?.name || selectedCategory}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking/Event Name
                </label>
                <input
                  type="text"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter booking or event name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedCategory === 'rooms' ? 'Number of Rooms' : 'Number of People'}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="partial">Partially Booked</option>
                  <option value="booked">Fully Booked</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex justify-between p-6 border-t">
              <div>
                {editingEntry && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyAvailabilityCalendar;
