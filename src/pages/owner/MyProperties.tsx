import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin, 
  Star, 
  DollarSign,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Utensils,
  Snowflake,
  Tv,
  Dumbbell,
  Pool,
  Camera,
  Upload,
  X
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  type: 'villa' | 'resort' | 'farmhouse' | 'homestay' | 'heritage' | 'day-picnic';
  location: string;
  city: string;
  state: string;
  price: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  status: 'active' | 'inactive' | 'pending' | 'maintenance';
  rating: number;
  totalBookings: number;
  totalEarnings: number;
  images: string[];
  amenities: string[];
  description: string;
  createdAt: string;
  lastUpdated: string;
}

const MyProperties: React.FC<{
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Mock data for demonstration
  const mockProperties: Property[] = [
    {
      id: '1',
      name: 'Sunset Villa Paradise',
      type: 'villa',
      location: 'Goa Beach Road',
      city: 'Goa',
      state: 'Goa',
      price: 15000,
      capacity: 8,
      bedrooms: 4,
      bathrooms: 3,
      status: 'active',
      rating: 4.8,
      totalBookings: 45,
      totalEarnings: 675000,
      images: ['/lovable-uploads/beachside-paradise.jpg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym'],
      description: 'Luxurious beachfront villa with stunning ocean views and modern amenities.',
      createdAt: '2024-01-15',
      lastUpdated: '2024-08-10'
    },
    {
      id: '2',
      name: 'Mountain Retreat Cottage',
      type: 'homestay',
      location: 'Himalayan Valley',
      city: 'Manali',
      state: 'Himachal Pradesh',
      price: 8000,
      capacity: 4,
      bedrooms: 2,
      bathrooms: 2,
      status: 'active',
      rating: 4.6,
      totalBookings: 32,
      totalEarnings: 256000,
      images: ['/lovable-uploads/mountain-cottage.jpg'],
      amenities: ['wifi', 'heating', 'kitchen', 'fireplace'],
      description: 'Cozy mountain cottage with panoramic views of snow-capped peaks.',
      createdAt: '2024-02-20',
      lastUpdated: '2024-08-08'
    },
    {
      id: '3',
      name: 'Royal Heritage Palace',
      type: 'heritage',
      location: 'Old City',
      city: 'Jaipur',
      state: 'Rajasthan',
      price: 25000,
      capacity: 12,
      bedrooms: 6,
      bathrooms: 4,
      status: 'pending',
      rating: 0,
      totalBookings: 0,
      totalEarnings: 0,
      images: ['/lovable-uploads/royal-heritage-villa.jpg'],
      amenities: ['wifi', 'ac', 'parking', 'kitchen', 'pool', 'spa'],
      description: 'Magnificent heritage palace with royal architecture and luxury amenities.',
      createdAt: '2024-08-01',
      lastUpdated: '2024-08-01'
    }
  ];

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/owner/login');
      return;
    }
    
    // Load mock data
    setProperties(mockProperties);
    setFilteredProperties(mockProperties);
  }, [isAuthenticated, user, loading, navigate]);

  useEffect(() => {
    let filtered = properties;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }
    
    setFilteredProperties(filtered);
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'villa': return 'Villa';
      case 'resort': return 'Resort';
      case 'farmhouse': return 'Farmhouse';
      case 'homestay': return 'Homestay';
      case 'heritage': return 'Heritage Palace';
      case 'day-picnic': return 'Day Picnic';
      default: return type;
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'ac': return <Snowflake className="w-4 h-4" />;
      case 'parking': return <Car className="w-4 h-4" />;
      case 'kitchen': return <Utensils className="w-4 h-4" />;
      case 'pool': return <Pool className="w-4 h-4" />;
      case 'gym': return <Dumbbell className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'heating': return <Snowflake className="w-4 h-4" />;
      case 'fireplace': return <Snowflake className="w-4 h-4" />;
      case 'spa': return <Snowflake className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const handleAddProperty = () => {
    setShowAddProperty(true);
    setEditingProperty(null);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowAddProperty(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (confirm('Are you sure you want to delete this property?')) {
      setProperties(properties.filter(p => p.id !== propertyId));
    }
  };

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const PropertyForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Property Name</Label>
          <Input 
            id="name" 
            placeholder="Enter property name"
            defaultValue={editingProperty?.name || ''}
          />
        </div>
        <div>
          <Label htmlFor="type">Property Type</Label>
          <Select defaultValue={editingProperty?.type || 'villa'}>
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="resort">Resort</SelectItem>
              <SelectItem value="farmhouse">Farmhouse</SelectItem>
              <SelectItem value="homestay">Homestay</SelectItem>
              <SelectItem value="heritage">Heritage Palace</SelectItem>
              <SelectItem value="day-picnic">Day Picnic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            placeholder="Enter location"
            defaultValue={editingProperty?.location || ''}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            placeholder="Enter city"
            defaultValue={editingProperty?.city || ''}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            placeholder="Enter state"
            defaultValue={editingProperty?.state || ''}
          />
        </div>
        <div>
          <Label htmlFor="price">Price per Day (₹)</Label>
          <Input 
            id="price" 
            type="number"
            placeholder="Enter price"
            defaultValue={editingProperty?.price || ''}
          />
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input 
            id="capacity" 
            type="number"
            placeholder="Enter capacity"
            defaultValue={editingProperty?.capacity || ''}
          />
        </div>
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input 
            id="bedrooms" 
            type="number"
            placeholder="Enter number of bedrooms"
            defaultValue={editingProperty?.bedrooms || ''}
          />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input 
            id="bathrooms" 
            type="number"
            placeholder="Enter number of bathrooms"
            defaultValue={editingProperty?.bathrooms || ''}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Enter property description"
          rows={4}
          defaultValue={editingProperty?.description || ''}
        />
      </div>

      <div>
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {['wifi', 'ac', 'parking', 'kitchen', 'pool', 'gym', 'tv', 'spa'].map(amenity => (
            <div key={amenity} className="flex items-center space-x-2">
              <input type="checkbox" id={amenity} className="rounded" />
              <Label htmlFor={amenity} className="text-sm capitalize">{amenity}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Property Images</Label>
        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="https://static.readdy.ai/image/15b9112da3f324084e8b4fa88fcbe450/72b18a0ae9a329ec72d4c44a4f7ac86d.png"
                alt="Picnify Logo"
                className="h-8 w-auto"
              />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="fas fa-bars text-gray-600"></i>
          </button>
        </div>
        <nav className="mt-4">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
            { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
            { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
            { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
            { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
            { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
            { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${
                activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} w-5 text-center`}></i>
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">My Properties</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredProperties.length} Properties
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleAddProperty} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                  <SelectItem value="farmhouse">Farmhouse</SelectItem>
                  <SelectItem value="homestay">Homestay</SelectItem>
                  <SelectItem value="heritage">Heritage Palace</SelectItem>
                  <SelectItem value="day-picnic">Day Picnic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative">
                    <img
                      src={property.images[0] || '/placeholder.svg'}
                      alt={property.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getStatusColor(property.status)}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {getTypeLabel(property.type)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{property.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{property.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{property.location}, {property.city}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {property.capacity}
                      </div>
                      <div className="flex items-center">
                        <Bed className="w-4 h-4 mr-1" />
                        {property.bedrooms}
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1" />
                        {property.bathrooms}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      ₹{property.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {property.totalBookings} bookings
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ₹{property.totalEarnings.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    {property.amenities.slice(0, 4).map((amenity) => (
                      <div key={amenity} className="p-1 bg-gray-100 rounded" title={amenity}>
                        {getAmenityIcon(amenity)}
                      </div>
                    ))}
                    {property.amenities.length > 4 && (
                      <div className="text-xs text-gray-500">+{property.amenities.length - 4} more</div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProperty(property)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProperty(property)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-home text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <Button onClick={handleAddProperty} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Property Dialog */}
      <Dialog open={showAddProperty} onOpenChange={setShowAddProperty}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? 'Edit Property' : 'Add New Property'}
            </DialogTitle>
          </DialogHeader>
          <PropertyForm />
          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="outline" onClick={() => setShowAddProperty(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {editingProperty ? 'Update Property' : 'Add Property'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Details Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProperty.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedProperty.images[0] || '/placeholder.svg'}
                      alt={selectedProperty.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProperty.name}</h3>
                      <p className="text-gray-600">{selectedProperty.location}, {selectedProperty.city}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(selectedProperty.status)}>
                        {selectedProperty.status.charAt(0).toUpperCase() + selectedProperty.status.slice(1)}
                      </Badge>
                      <Badge variant="secondary">{getTypeLabel(selectedProperty.type)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Price:</span> ₹{selectedProperty.price.toLocaleString()}/day
                      </div>
                      <div>
                        <span className="font-medium">Capacity:</span> {selectedProperty.capacity} guests
                      </div>
                      <div>
                        <span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms}
                      </div>
                      <div>
                        <span className="font-medium">Bathrooms:</span> {selectedProperty.bathrooms}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Rating:</span> {selectedProperty.rating}/5
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedProperty.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedProperty.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2 text-sm">
                        {getAmenityIcon(amenity)}
                        <span className="capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Bookings:</span> {selectedProperty.totalBookings}
                  </div>
                  <div>
                    <span className="font-medium">Total Earnings:</span> ₹{selectedProperty.totalEarnings.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedProperty.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyProperties;
