
import React, { useState, useEffect } from 'react';
import { X, Save, History, Calendar, ToggleLeft, ToggleRight, Video, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PropertyAvailabilityCalendar from './PropertyAvailabilityCalendar';

interface PropertyWithDetails {
  id: string;
  title: string;
  description: string;
  address: string;
  property_type: string;
  status: string;
  amenities: string[];
  images: string[];
  pricing: any;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  menu_available?: boolean;
  admin_blocked?: boolean;
  host_details?: any;
  video_url?: string;
  banquet_hall_capacity?: number;
  ground_lawn_capacity?: number;
  owner?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface StatusHistoryEntry {
  id: string;
  from_status: string;
  to_status: string;
  reason: string;
  comment: string;
  actor_role: string;
  created_at: string;
}

interface EnhancedPropertyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
  onPropertyUpdate: () => void;
}

const EnhancedPropertyDetailsDrawer: React.FC<EnhancedPropertyDetailsDrawerProps> = ({
  isOpen,
  onClose,
  propertyId,
  onPropertyUpdate,
}) => {
  const [property, setProperty] = useState<PropertyWithDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'availability'>('details');

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
      fetchStatusHistory();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`*`)
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      if (data) {
        setProperty({
          ...data,
          menu_available: (data as any).menu_available || false,
          admin_blocked: (data as any).admin_blocked || false,
          host_details: (data as any).host_details || {},
          video_url: (data as any).video_url || undefined,
          banquet_hall_capacity: (data as any).banquet_hall_capacity || undefined,
          ground_lawn_capacity: (data as any).ground_lawn_capacity || undefined,
        });

        // Fetch owner details
        const { data: owner } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', data.owner_id)
          .single();

        if (owner) {
          setProperty(prev => prev ? { ...prev, owner } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast.error('Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async () => {
    if (!propertyId) return;

    try {
      // Try to fetch status history, gracefully handle if table doesn't exist
      const { data, error } = await supabase
        .from('property_status_history' as any)
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Status history table not available:', error);
        setStatusHistory([]);
      } else {
        setStatusHistory((data || []).map(item => ({
          id: item.id,
          from_status: item.from_status || '',
          to_status: item.to_status || '',
          reason: item.reason || '',
          comment: item.comment || '',
          actor_role: item.actor_role || '',
          created_at: item.created_at || '',
        })));
      }
    } catch (error) {
      console.log('Status history table not available:', error);
      setStatusHistory([]);
    }
  };

  const handleToggleMenuAvailable = async () => {
    if (!property) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ menu_available: !property.menu_available } as any)
        .eq('id', property.id);

      if (error) throw error;

      setProperty({ ...property, menu_available: !property.menu_available });
      toast.success(`Menu ${!property.menu_available ? 'enabled' : 'disabled'} for this property`);
      onPropertyUpdate();
    } catch (error) {
      console.error('Error updating menu status:', error);
      toast.error('Failed to update menu status');
    }
  };

  const handleToggleAdminBlocked = async () => {
    if (!property) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ admin_blocked: !property.admin_blocked } as any)
        .eq('id', property.id);

      if (error) throw error;

      setProperty({ ...property, admin_blocked: !property.admin_blocked });
      toast.success(`Property ${!property.admin_blocked ? 'blocked' : 'unblocked'} by admin`);
      onPropertyUpdate();
    } catch (error) {
      console.error('Error updating admin block status:', error);
      toast.error('Failed to update admin block status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : property ? (
          <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4 mr-1" />
                History ({statusHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeTab === 'availability'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Availability
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="text-gray-900">{property.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Property Type</label>
                          <p className="text-gray-900">{property.property_type}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'approved' ? 'bg-green-100 text-green-800' :
                            property.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <p className="text-gray-900">{property.address}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Capacity & Features</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                          <p className="text-gray-900">{property.max_guests}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                          <p className="text-gray-900">{property.bedrooms}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                          <p className="text-gray-900">{property.bathrooms}</p>
                        </div>
                        {property.banquet_hall_capacity && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-sm">Banquet Hall: {property.banquet_hall_capacity}</span>
                          </div>
                        )}
                        {property.ground_lawn_capacity && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-sm">Ground/Lawn: {property.ground_lawn_capacity}</span>
                          </div>
                        )}
                        {property.video_url && (
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                              View Property Video
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  {property.owner && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Owner Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="text-gray-900">{property.owner.full_name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{property.owner.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-gray-900">{property.owner.phone || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Controls */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Menu Available</label>
                          <p className="text-xs text-gray-500">Allow this property to show menu options</p>
                        </div>
                        <button
                          onClick={handleToggleMenuAvailable}
                          className="flex items-center"
                        >
                          {property.menu_available ? (
                            <ToggleRight className="w-8 h-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Admin Blocked</label>
                          <p className="text-xs text-gray-500">Block this property from appearing in searches</p>
                        </div>
                        <button
                          onClick={handleToggleAdminBlocked}
                          className="flex items-center"
                        >
                          {property.admin_blocked ? (
                            <ToggleRight className="w-8 h-8 text-red-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  {property.images && property.images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Property Images</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {property.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status History</h3>
                  {statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {statusHistory.map((entry) => (
                        <div key={entry.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {entry.from_status ? `${entry.from_status} → ` : ''}
                                <span className={`${
                                  entry.to_status === 'approved' ? 'text-green-600' :
                                  entry.to_status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                                }`}>
                                  {entry.to_status}
                                </span>
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {entry.actor_role}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Reason: </span>
                              <span className="text-sm text-gray-600">{entry.reason}</span>
                            </div>
                          )}
                          {entry.comment && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Comment: </span>
                              <span className="text-sm text-gray-600">{entry.comment}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No status history available</p>
                  )}
                </div>
              )}

              {activeTab === 'availability' && (
                <PropertyAvailabilityCalendar propertyId={propertyId} />
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-gray-500">Property not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPropertyDetailsDrawer;
