import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  MapPin,
  Upload,
  Save,
  X,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SharedSidebar from '@/components/admin/SharedSidebar';
import SharedHeader from '@/components/admin/SharedHeader';
import { LocationService, type Location, type LocationFormData, LOCATION_CATEGORIES, INDIAN_REGIONS } from '@/lib/locationService';

const LocationManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    state: '',
    region: '',
    category: 'general',
    cover_image_url: '',
    description: '',
    featured: false,
    trending: false,
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await LocationService.getAllLocationsForAdmin();
      setLocations(data);
    } catch (error: any) {
      toast.error('Failed to fetch locations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      state: '',
      region: '',
      category: 'general',
      cover_image_url: '',
      description: '',
      featured: false,
      trending: false,
      display_order: 0,
      is_active: true
    });
    setEditingLocation(null);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      state: location.state,
      region: location.region,
      category: location.category,
      cover_image_url: location.cover_image_url || '',
      description: location.description || '',
      featured: location.featured,
      trending: location.trending,
      display_order: location.display_order,
      is_active: location.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLocation) {
        await LocationService.updateLocation(editingLocation.id, formData);
        toast.success('Location updated successfully!');
      } else {
        await LocationService.createLocation(formData);
        toast.success('Location created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      toast.error('Failed to save location: ' + error.message);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete ${location.name}?`)) return;
    
    try {
      // Delete cover image if exists
      if (location.cover_image_url) {
        await LocationService.deleteCoverImage(location.cover_image_url);
      }
      
      await LocationService.deleteLocation(location.id);
      toast.success('Location deleted successfully!');
      fetchLocations();
    } catch (error: any) {
      toast.error('Failed to delete location: ' + error.message);
    }
  };

  const handleToggleStatus = async (location: Location) => {
    try {
      await LocationService.toggleLocationStatus(location.id, !location.is_active);
      toast.success(`Location ${!location.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchLocations();
    } catch (error: any) {
      toast.error('Failed to update location status: ' + error.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await LocationService.uploadCoverImage(file, formData.name || 'location');
      setFormData({ ...formData, cover_image_url: imageUrl });
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = LOCATION_CATEGORIES.find(cat => cat.value === category);
    return categoryData?.icon || 'fas fa-map-marker-alt';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Location Management"
          subtitle="Manage destination cards and locations"
        />

        <div className="p-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
              <p className="text-gray-600">Manage destination cards shown on the locations page</p>
            </div>
            
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setShowModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLocation ? 'Edit Location' : 'Add New Location'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Location Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Goa, Manali"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g., Goa, Himachal Pradesh"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="region">Region *</Label>
                      <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_REGIONS.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center">
                                <i className={`${category.icon} mr-2`}></i>
                                {category.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the destination"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cover-image">Cover Image</Label>
                    <div className="space-y-2">
                      {formData.cover_image_url && (
                        <img 
                          src={formData.cover_image_url} 
                          alt="Cover preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <div className="flex items-center text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Uploading...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="display-order">Display Order</Label>
                      <Input
                        id="display-order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                      />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="trending"
                        checked={formData.trending}
                        onCheckedChange={(checked) => setFormData({ ...formData, trending: checked })}
                      />
                      <Label htmlFor="trending">Trending</Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      {editingLocation ? 'Update' : 'Create'} Location
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Locations Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Card key={location.id} className={`overflow-hidden ${!location.is_active ? 'opacity-60' : ''}`}>
                  <div className="relative">
                    {location.cover_image_url ? (
                      <img 
                        src={location.cover_image_url} 
                        alt={location.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {location.trending && (
                        <Badge variant="destructive" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {location.featured && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-white/90">
                        <i className={`${getCategoryIcon(location.category)} mr-1`}></i>
                        {LOCATION_CATEGORIES.find(cat => cat.value === location.category)?.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{location.name}</h3>
                        <p className="text-sm text-gray-600">{location.state}</p>
                      </div>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {location.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{location.properties || 0} properties</span>
                      <span>Order: {location.display_order}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(location)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleStatus(location)}
                      >
                        {location.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(location)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {locations.length === 0 && !loading && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No locations found</h3>
              <p className="text-gray-500 mb-4">Create your first location to get started</p>
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Location
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;


