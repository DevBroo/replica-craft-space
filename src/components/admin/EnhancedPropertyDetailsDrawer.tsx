
import React, { useState, useEffect } from 'react';
import { X, Eye, Users, MapPin, Calendar, FileText, Shield, Camera, Video, User, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PropertyAvailabilityCalendar from './PropertyAvailabilityCalendar';

interface PropertyWithDetails {
  id: string;
  title: string;
  description: string;
  address: string;
  property_type: string;
  property_subtype?: string;
  status: string;
  images: string[];
  video_url?: string;
  amenities: string[];
  pricing: any;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  rooms_count?: number;
  capacity_per_room?: number;
  day_picnic_capacity?: number;
  banquet_hall_capacity?: number;
  ground_lawn_capacity?: number;
  menu_available: boolean;
  host_details: any;
  policies_extended: any;
  cancellation_policy?: string;
  contact_phone?: string;
  license_number?: string;
  rating: number;
  review_count: number;
  created_at: string;
  owner_id: string;
  admin_blocked: boolean;
}

interface OwnerDetails {
  full_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  gst_number?: string;
  pan_number?: string;
}

interface EnhancedPropertyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string | null;
}

const EnhancedPropertyDetailsDrawer: React.FC<EnhancedPropertyDetailsDrawerProps> = ({
  isOpen,
  onClose,
  propertyId,
}) => {
  const [property, setProperty] = useState<PropertyWithDetails | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<OwnerDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
      fetchStatusHistory();
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      
      // Fetch property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      
      // Convert the data to our PropertyWithDetails type, adding defaults for missing fields
      const propertyWithDefaults: PropertyWithDetails = {
        ...propertyData,
        menu_available: (propertyData as any).menu_available || false,
        host_details: (propertyData as any).host_details || {},
        admin_blocked: (propertyData as any).admin_blocked || false,
        video_url: (propertyData as any).video_url || undefined,
        banquet_hall_capacity: (propertyData as any).banquet_hall_capacity || undefined,
        ground_lawn_capacity: (propertyData as any).ground_lawn_capacity || undefined,
      };
      
      setProperty(propertyWithDefaults);

      // Fetch owner details from both profiles and owner_profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', propertyData.owner_id)
        .single();

      const { data: ownerProfileData } = await supabase
        .from('owner_profiles')
        .select('company_name, gst_number, pan_number')
        .eq('user_id', propertyData.owner_id)
        .single();

      setOwnerDetails({
        ...profileData,
        ...ownerProfileData,
      });

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
      // Use any type to handle missing type definition
      const { data, error } = await (supabase as any)
        .from('property_status_history')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Status history table not available:', error);
        setStatusHistory([]);
      } else {
        setStatusHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      setStatusHistory([]);
    }
  };

  const handleToggleBlock = async () => {
    if (!property) return;
    
    try {
      setUpdating(true);
      const newBlockedStatus = !property.admin_blocked;
      
      // Use any type to handle missing column in types
      const { error } = await (supabase as any)
        .from('properties')
        .update({ admin_blocked: newBlockedStatus })
        .eq('id', property.id);

      if (error) throw error;
      
      setProperty({ ...property, admin_blocked: newBlockedStatus });
      toast.success(`Property ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully`);
    } catch (error) {
      console.error('Error updating block status:', error);
      toast.error('Failed to update block status');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleMenu = async () => {
    if (!property) return;
    
    try {
      setUpdating(true);
      const newMenuStatus = !property.menu_available;
      
      // Use any type to handle missing column in types
      const { error } = await (supabase as any)
        .from('properties')
        .update({ menu_available: newMenuStatus })
        .eq('id', property.id);

      if (error) throw error;
      
      setProperty({ ...property, menu_available: newMenuStatus });
      toast.success(`Menu availability ${newMenuStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating menu status:', error);
      toast.error('Failed to update menu status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-4xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold">Property Details</h2>
              {property && (
                <p className="text-sm text-gray-600">{property.title}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : property ? (
          <div className="p-6">
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                  {property.admin_blocked && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      Admin Blocked
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleMenu}
                    disabled={updating}
                    className="flex items-center space-x-2 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                  >
                    {property.menu_available ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    <span>Menu {property.menu_available ? 'Available' : 'Not Available'}</span>
                  </button>
                  <button
                    onClick={handleToggleBlock}
                    disabled={updating}
                    className={`px-3 py-1 text-sm rounded-md ${
                      property.admin_blocked
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {property.admin_blocked ? 'Unblock' : 'Block'} Property
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6">
              <nav className="flex space-x-8">
                {[
                  { key: 'overview', label: 'Overview', icon: Eye },
                  { key: 'media', label: 'Media', icon: Camera },
                  { key: 'host', label: 'Host Details', icon: User },
                  { key: 'policies', label: 'Policies', icon: FileText },
                  { key: 'availability', label: 'Availability', icon: Calendar },
                  { key: 'history', label: 'Status History', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Property Type</label>
                        <p className="mt-1 text-sm text-gray-900">{property.property_type}</p>
                      </div>
                      {property.property_subtype && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subtype</label>
                          <p className="mt-1 text-sm text-gray-900">{property.property_subtype}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="mt-1 text-sm text-gray-900">{property.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{property.contact_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <p className="mt-1 text-sm text-gray-900">{property.license_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Capacity Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                        <p className="mt-1 text-sm text-gray-900">{property.max_guests}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                        <p className="mt-1 text-sm text-gray-900">{property.bedrooms}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                        <p className="mt-1 text-sm text-gray-900">{property.bathrooms}</p>
                      </div>
                      {property.rooms_count && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total Rooms</label>
                          <p className="mt-1 text-sm text-gray-900">{property.rooms_count}</p>
                        </div>
                      )}
                      {property.day_picnic_capacity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Day Picnic Capacity</label>
                          <p className="mt-1 text-sm text-gray-900">{property.day_picnic_capacity} people</p>
                        </div>
                      )}
                      {property.banquet_hall_capacity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Banquet Hall Capacity</label>
                          <p className="mt-1 text-sm text-gray-900">{property.banquet_hall_capacity} people</p>
                        </div>
                      )}
                      {property.ground_lawn_capacity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ground/Lawn Capacity</label>
                          <p className="mt-1 text-sm text-gray-900">{property.ground_lawn_capacity} people</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Details */}
                  {ownerDetails && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Owner Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.full_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.company_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">GST Number</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.gst_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                          <p className="mt-1 text-sm text-gray-900">{ownerDetails.pan_number || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-sm text-gray-900">{property.description || 'No description provided'}</p>
                  </div>

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Property Images */}
                  {property.images && property.images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Property Images</h3>
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

                  {/* Property Video */}
                  {property.video_url && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Property Video</h3>
                      <div className="aspect-w-16 aspect-h-9">
                        <video
                          src={property.video_url}
                          controls
                          className="w-full h-64 rounded-lg"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {!property.images?.length && !property.video_url && (
                    <p className="text-gray-500 text-center py-8">No media available</p>
                  )}
                </div>
              )}

              {activeTab === 'host' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-3">Host/Caretaker Details</h3>
                  {property.host_details && Object.keys(property.host_details).length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(property.host_details, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500">No host/caretaker details provided</p>
                  )}
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cancellation Policy</h3>
                    <p className="text-sm text-gray-900">{property.cancellation_policy || 'Not specified'}</p>
                  </div>

                  {property.policies_extended && Object.keys(property.policies_extended).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Extended Policies</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(property.policies_extended, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'availability' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Property Availability Calendar</h3>
                  <PropertyAvailabilityCalendar propertyId={property.id} isAdminOverride={true} />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status History</h3>
                  {statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {statusHistory.map((entry, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(entry.to_status)}`}>
                                {entry.from_status || 'New'} → {entry.to_status}
                              </span>
                              <span className="text-sm text-gray-600">
                                {entry.actor_role === 'admin' ? 'Admin' : 'Owner'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Reason:</span> {entry.reason}
                            </p>
                          )}
                          {entry.comment && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Comment:</span> {entry.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No status history available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Property not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPropertyDetailsDrawer;
