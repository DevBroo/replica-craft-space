import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatPropertyType } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, DollarSign, Star, MessageSquare, User, Settings as SettingsIcon, BarChart3, Bell, Menu, X, LogOut } from 'lucide-react';
import BookingComPropertyForm from './BookingComPropertyForm';

interface PropertiesProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onBack?: () => void;
  editProperty?: any;
}

const Properties: React.FC<PropertiesProps> = ({ 
  sidebarCollapsed = false, 
  toggleSidebar = () => {}, 
  activeTab = 'properties', 
  setActiveTab = () => {},
  onBack = () => {},
  editProperty = null
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showFullPropertyForm, setShowFullPropertyForm] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const propertyTypes = [
    'Hotels',
    'Apartments', 
    'Resorts',
    'Villas',
    'Homestays',
    'Farm Houses',
    'Day Picnic',  // Added Day Picnic type
    'Other'
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load properties",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsEditMode(false);
    setSelectedPropertyType('');
    setShowTypeSelector(false);
    setShowAddForm(true);
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    setIsEditMode(true);
    setShowFullPropertyForm(true);
  };

  const handlePropertyTypeSelection = (type: string) => {
    setSelectedPropertyType(type);
    setShowTypeSelector(true);
    
    // Show full form for all property types including Day Picnic
    setShowFullPropertyForm(true);
    setShowAddForm(false);
  };

  const handleCreateDayPicnicProperty = async () => {
    if (!propertyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a property name first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create basic property record first
      const basicPropertyData = {
        owner_id: user?.id,
        title: propertyName.trim(),
        description: 'Day Picnic Property - Setup in progress',
        address: 'To be updated',
        property_type: 'Day Picnic',
        max_guests: 1,
        pricing: {
          daily_rate: 0,
          currency: 'INR'
        },
        status: 'pending', // Keep as pending until Day Picnic setup is complete
        images: [],
        amenities: []
      };

      const { data, error } = await supabase
        .from('properties')
        .insert(basicPropertyData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Property created! Complete your Day Picnic setup.",
      });

      // Navigate to Day Picnic setup page
      navigate(`/host/day-picnic-setup/${data.id}`);
      
    } catch (error: any) {
      console.error('Error creating Day Picnic property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFullForm = () => {
    setShowFullPropertyForm(false);
    setShowAddForm(false);
    setEditingProperty(null);
    setIsEditMode(false);
    setSelectedPropertyType('');
    setPropertyName('');
    fetchProperties(); // Refresh properties list
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Your Properties
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your properties and listings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹23,456</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Properties</CardTitle>
          <Button onClick={handleAddProperty}>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading properties...</div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                   <div className="flex-1">
                     <p className="font-medium">{property.title}</p>
                     <p className="text-sm text-gray-600">{formatPropertyType(property.property_type)}</p>
                     <p className="text-xs text-gray-500">
                       ₹{property.pricing?.daily_rate || 0}/night
                     </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {property.property_type === 'Day Picnic' ? (
                        `Max: ${property.day_picnic_capacity || property.max_guests || 0} guests for day picnic`
                      ) : (
                        property.rooms_count && property.capacity_per_room ? (
                          `Max: ${property.max_guests || 0} guests (${property.rooms_count} rooms × ${property.capacity_per_room} each)`
                        ) : (
                          `Max: ${property.max_guests || 0} guests`
                        )
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProperty(property)}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      property.status === 'approved' ? 'bg-green-100 text-green-800' :
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {property.status}
                    </div>
                  </div>
                  {/* <Badge variant="secondary" className={
                    property.status === 'approved' ? 'bg-green-100 text-green-800' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {property.status}
                  </Badge> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No properties yet</div>
          )}
        </CardContent>
      </Card>

      {/* Add Property Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input
                  id="property-name"
                  placeholder="Enter property name"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                />
              </div>
              
              {!showTypeSelector && (
                <div>
                  <Label>Property Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {propertyTypes.map((type) => (
                      <Button
                        key={type}
                        variant={selectedPropertyType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePropertyTypeSelection(type)}
                        className={type === 'Day Picnic' ? 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300' : ''}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}


              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setShowTypeSelector(false);
                    setSelectedPropertyType('');
                    setPropertyName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedPropertyType) {
                      setShowFullPropertyForm(true);
                      setShowAddForm(false);
                    }
                  }}
                  disabled={!propertyName.trim() || !selectedPropertyType}
                  className="flex-1"
                >
                  {selectedPropertyType ? 'Continue to Full Form' : 'Select Type'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Property Form Modal */}
      {showFullPropertyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] overflow-y-auto">
            <BookingComPropertyForm 
              onBack={handleCloseFullForm}
              editProperty={editingProperty}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your property
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </div>
  );
};

export default Properties;
