import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatPropertyType } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Eye, Check, X, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Home, Calendar, DollarSign, Star, MessageSquare, User, Settings as SettingsIcon, BarChart3, Bell, Menu, LogOut } from 'lucide-react';
import PropertyWizard from './PropertyWizard';
import { PropertyQuickView } from './PropertyQuickView';
import DayPicnicWizard from './DayPicnicWizard';
import { PropertyCard } from './PropertyCard';

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
  const [packagesByProperty, setPackagesByProperty] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showFullPropertyForm, setShowFullPropertyForm] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPropertyForView, setSelectedPropertyForView] = useState<any>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewInitialTab, setQuickViewInitialTab] = useState<'overview' | 'pricing' | 'rooms' | 'amenities' | 'policies' | 'location'>('overview');
  const [activePropertyTab, setActivePropertyTab] = useState<'properties' | 'day-picnic'>('properties');
  const [showDayPicnicForm, setShowDayPicnicForm] = useState(false);

  const propertyTypes = [
    'Hotels',
    'Villas', 
    'Resorts',
    'Farmhouse',
    'Homestay',
    'Apartments',
    'Guesthouse',
    'Hostel',
    'Heritage Palace',
    'Banquet Hall',
    'Wedding Venue'
  ];

  useEffect(() => {
    if (!user?.id) return; // Wait for user to be available
    
    fetchProperties();
    
    // Check for URL parameters to auto-open add property modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === '1') {
      handleAddProperty();
      // Clean URL after opening modal
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]add=1/, '').replace(/^&/, '?');
      window.history.replaceState({}, '', newUrl);
    }
  }, [user?.id]);

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

      // Fetch packages and option prices for Day Picnic properties
      const dayPicnicProperties = (data || []).filter(p => p.property_type === 'Day Picnic');
      if (dayPicnicProperties.length > 0) {
        const propertyIds = dayPicnicProperties.map(p => p.id);
        const { data: packagesData, error: packagesError } = await supabase
          .from('day_picnic_packages')
          .select('id, property_id, inclusions, exclusions')
          .in('property_id', propertyIds);

        if (!packagesError && packagesData) {
          // Fetch option prices for inclusions and exclusions
          const packageIds = packagesData.map(pkg => pkg.id);
          const { data: optionPrices } = await supabase
            .from('day_picnic_option_prices')
            .select('package_id, name, price, option_type')
            .in('package_id', packageIds)
            .in('option_type', ['inclusion', 'exclusion']);

          // Group option prices by package ID and type
          const inclusionsByPackage = (optionPrices || [])
            .filter(opt => opt.option_type === 'inclusion')
            .reduce((acc, opt) => {
              if (!acc[opt.package_id]) acc[opt.package_id] = [];
              acc[opt.package_id].push(opt.name);
              return acc;
            }, {} as Record<string, string[]>);

          const exclusionsByPackage = (optionPrices || [])
            .filter(opt => opt.option_type === 'exclusion')
            .reduce((acc, opt) => {
              if (!acc[opt.package_id]) acc[opt.package_id] = [];
              acc[opt.package_id].push({ name: opt.name, price: opt.price });
              return acc;
            }, {} as Record<string, any[]>);

          const packagesMap = packagesData.reduce((acc, pkg) => {
            if (!acc[pkg.property_id]) acc[pkg.property_id] = [];
            acc[pkg.property_id].push({
              ...pkg,
              inclusionsFromOptions: inclusionsByPackage[pkg.id] || [],
              exclusionsFromOptions: exclusionsByPackage[pkg.id] || [],
              // Use inclusions from options if available, fallback to package inclusions
              displayInclusions: inclusionsByPackage[pkg.id] || pkg.inclusions || []
            });
            return acc;
          }, {} as Record<string, any[]>);
          setPackagesByProperty(packagesMap);
        }
      }
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

  const handleAddDayPicnic = () => {
    setShowDayPicnicForm(true);
  };

  const handleEditProperty = (property: any) => {
    // For all property types, open PropertyWizard for general editing
    setEditingProperty(property);
    setIsEditMode(true);
    setShowFullPropertyForm(true);
  };

  const handleEditDayPicnicPricing = (property: any) => {
    // Navigate to Day Picnic pricing setup
    navigate(`/owner/day-picnic-setup/${property.id}`);
  };

  const handleViewProperty = (property: any, tab: 'overview' | 'pricing' | 'rooms' | 'amenities' | 'policies' | 'location' = 'overview') => {
    setSelectedPropertyForView(property);
    setQuickViewInitialTab(tab);
    setShowQuickView(true);
  };

  const handleCloseQuickView = () => {
    setShowQuickView(false);
    setSelectedPropertyForView(null);
    setQuickViewInitialTab('overview');
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
      navigate(`/owner/day-picnic-setup/${data.id}`);
      
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

  const handleCloseDayPicnicForm = () => {
    setShowDayPicnicForm(false);
    fetchProperties(); // Refresh the list
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
          <div className="flex items-center space-x-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActivePropertyTab('properties')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePropertyTab === 'properties'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActivePropertyTab('day-picnic')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePropertyTab === 'day-picnic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day Picnic
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant='destructive' onClick={handleAddProperty}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
            <Button variant='outline' onClick={handleAddDayPicnic} className="border-orange-500 text-orange-600 hover:bg-orange-50">
              <Plus className="w-4 h-4 mr-2" />
              Add Day Picnic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading properties...</div>
          ) : (() => {
            // Filter properties based on active tab
            const filteredProperties = properties.filter(property => {
              if (activePropertyTab === 'day-picnic') {
                return property.property_type === 'Day Picnic' || property.property_type === 'day-picnic';
              } else {
                return property.property_type !== 'Day Picnic' && property.property_type !== 'day-picnic';
              }
            });

            return filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    packagesByProperty={packagesByProperty}
                    onEdit={handleEditProperty}
                    onView={handleViewProperty}
                    onEditDayPicnicPricing={handleEditDayPicnicPricing}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {activePropertyTab === 'day-picnic' 
                    ? 'No day picnic properties found. Add your first day picnic property to get started!'
                    : 'No properties found. Add your first property to get started!'
                  }
                </p>
              </div>
            );
          })()}
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
          <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] overflow-y-auto">
            <PropertyWizard 
              onBack={handleCloseFullForm}
              propertyId={editingProperty?.id}
              initialTitle={propertyName}
              initialPropertyType={selectedPropertyType}
            />
          </div>
        </div>
      )}

      {/* Day Picnic Wizard Modal */}
      {showDayPicnicForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[95vh] overflow-y-auto">
            <DayPicnicWizard 
              onBack={handleCloseDayPicnicForm}
            />
          </div>
        </div>
      )}

      {/* Property Quick View Modal */}
      <PropertyQuickView
        property={selectedPropertyForView}
        isOpen={showQuickView}
        onClose={handleCloseQuickView}
        initialTab={quickViewInitialTab}
      />

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
