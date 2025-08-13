import React, { useState } from 'react';
import { 
  Plus,
  Eye,
  Trash2,
  Download,
  Grid3X3,
  List,
  ListChecks,
  Globe,
  CheckCircle,
  X,
  FileText,
  BookOpen,
  Image,
  Cog,
  Upload,
  Star,
  MessageSquare,
  Play,
  Edit,
  ChevronDown,
  Search,
  Monitor,
  Shield,
  ArrowUpDown,
  Clock,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/admin/ui/tabs';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';

const CMSManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('cms');
  const [activeSection, setActiveSection] = useState('banners');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');


  const homepageBannersData = [
    {
      id: 'HB001',
      title: 'Summer Sale - 40% Off',
      subtitle: 'Discover Amazing Deals on Premium Properties',
      status: 'Active',
      position: 'Hero',
      startDate: '2025-07-01',
      endDate: '2025-08-31',
      ctaText: 'Book Now',
      ctaLink: '/properties',
      backgroundImage: 'https://readdy.ai/api/search-image?query=luxury%20summer%20vacation%20banner%20with%20tropical%20resort%20and%20sale%20promotion%20professional%20marketing%20design&width=800&height=400&seq=banner-001&orientation=landscape',
      displayLocation: 'Homepage Hero',
      targetAudience: 'All Users',
      clicks: 1250,
      impressions: 8900
    },
    {
      id: 'HB002',
      title: 'New Property Launch',
      subtitle: 'Exclusive Beachfront Villas Now Available',
      status: 'Scheduled',
      position: 'Secondary',
      startDate: '2025-08-15',
      endDate: '2025-09-15',
      ctaText: 'Explore',
      ctaLink: '/properties/beachfront',
      backgroundImage: 'https://readdy.ai/api/search-image?query=stunning%20beachfront%20villa%20banner%20with%20ocean%20view%20and%20modern%20architecture%20professional%20real%20estate%20photography&width=800&height=400&seq=banner-002&orientation=landscape',
      displayLocation: 'Homepage Secondary',
      targetAudience: 'Registered Users',
      clicks: 0,
      impressions: 0
    },
    {
      id: 'HB003',
      title: 'Welcome Back!',
      subtitle: 'Special Offers for Returning Guests',
      status: 'Active',
      position: 'Footer',
      startDate: '2025-07-10',
      endDate: '2025-12-31',
      ctaText: 'View Offers',
      ctaLink: '/special-offers',
      backgroundImage: 'https://readdy.ai/api/search-image?query=welcome%20back%20banner%20with%20luxury%20hotel%20interior%20and%20warm%20hospitality%20theme%20professional%20hospitality%20photography&width=800&height=300&seq=banner-003&orientation=landscape',
      displayLocation: 'Footer Banner',
      targetAudience: 'Returning Customers',
      clicks: 340,
      impressions: 2100
    }
  ];

  const legalContentData = [
    {
      id: 'LC001',
      type: 'Terms of Service',
      title: 'Terms of Service',
      status: 'Published',
      version: '2.1',
      lastUpdated: '2025-07-15',
      author: 'Legal Team',
      wordCount: 3250,
      readingTime: '13 min',
      sections: ['User Agreement', 'Property Booking', 'Cancellation Policy', 'Liability'],
      approvalStatus: 'Approved'
    },
    {
      id: 'LC002',
      type: 'Privacy Policy',
      title: 'Privacy Policy',
      status: 'Published',
      version: '1.8',
      lastUpdated: '2025-07-20',
      author: 'Legal Team',
      wordCount: 2890,
      readingTime: '12 min',
      sections: ['Data Collection', 'Data Usage', 'Cookies', 'Third Parties'],
      approvalStatus: 'Approved'
    },
    {
      id: 'LC003',
      type: 'FAQ',
      title: 'Frequently Asked Questions',
      status: 'Draft',
      version: '3.2',
      lastUpdated: '2025-07-28',
      author: 'Support Team',
      wordCount: 1450,
      readingTime: '6 min',
      sections: ['Booking', 'Payments', 'Cancellations', 'Property Features'],
      approvalStatus: 'Pending Review'
    },
    {
      id: 'LC004',
      type: 'Refund Policy',
      title: 'Refund and Cancellation Policy',
      status: 'Published',
      version: '1.5',
      lastUpdated: '2025-07-12',
      author: 'Legal Team',
      wordCount: 1890,
      readingTime: '8 min',
      sections: ['Cancellation Rules', 'Refund Process', 'Exceptions', 'Timeline'],
      approvalStatus: 'Approved'
    },
    {
      id: 'LC005',
      type: 'Cookie Policy',
      title: 'Cookie Policy',
      status: 'Published',
      version: '1.2',
      lastUpdated: '2025-07-18',
      author: 'Legal Team',
      wordCount: 980,
      readingTime: '4 min',
      sections: ['Cookie Types', 'Usage', 'Management', 'Third Party Cookies'],
      approvalStatus: 'Approved'
    }
  ];


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentData = () => {
    switch (activeSection) {
      case 'banners': return homepageBannersData;
      case 'legal': return legalContentData;
      default: return homepageBannersData;
    }
  };

  const filteredData = getCurrentData().filter((item: any) => {
    const searchFields = activeSection === 'banners'
      ? [item.title, item.subtitle, item.position, item.displayLocation]
      : [item.title, item.type, item.author];

    const matchesSearch = searchFields.some((field: string) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === 'all' || item.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map((item: any) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for items:`, selectedItems);
    setSelectedItems([]);
    setShowBulkActions(false);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const renderBannersTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((banner: any) => (
            <tr key={banner.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(banner.id)}
                  onChange={(e) => handleSelectItem(banner.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img 
                    className="h-12 w-20 object-cover rounded border" 
                    src={banner.backgroundImage} 
                    alt={banner.title}
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                    <div className="text-sm text-gray-500">{banner.subtitle}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">{banner.position}</span>
                <div className="text-xs text-gray-500">{banner.displayLocation}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(banner.status)}`}>
                  {banner.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="text-xs">
                  <div>Clicks: {banner.clicks.toLocaleString()}</div>
                  <div>Views: {banner.impressions.toLocaleString()}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                    title="Edit Banner"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="Preview Banner">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-purple-600 hover:text-purple-800 cursor-pointer p-1" title="Reorder">
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 cursor-pointer p-1" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLegalTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedItems.length === paginatedData.length && paginatedData.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((document: any) => (
            <tr key={document.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(document.id)}
                  onChange={(e) => handleSelectItem(document.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{document.title}</div>
                  <div className="text-sm text-gray-500">{document.author}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {document.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                v{document.version}
                <div className="text-xs text-gray-500">{document.approvalStatus}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(document.lastUpdated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="text-xs">
                  <div className="flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    {document.wordCount} words
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {document.readingTime}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(document)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                    title="Edit Document"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="Preview Document">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-purple-600 hover:text-purple-800 cursor-pointer p-1" title="Version History">
                    <Clock className="w-4 h-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 cursor-pointer p-1" title="External Link">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  const renderCurrentTable = () => {
    switch (activeSection) {
      case 'banners': return renderBannersTable();
      case 'legal': return renderLegalTable();
      default: return renderBannersTable();
    }
  };

  const getCreateButtonText = () => {
    switch (activeSection) {
      case 'banners': return 'Create New Banner';
      case 'legal': return 'Create New Document';
      default: return 'Create New';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="CMS Management" 
          breadcrumb="CMS Management"
          searchPlaceholder="Search content..."
        />

        {/* Tabs Navigation */}
        <div className="bg-white border-b">
          <div className="px-6">
            <Tabs value={activeSection} onValueChange={setActiveSection}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="banners" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Homepage Banners
                </TabsTrigger>
                <TabsTrigger value="legal" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Terms, FAQs & Policies
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {getCreateButtonText()}
              </button>
              
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {selectedItems.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex items-center"
                  >
                    <ListChecks className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedItems.length})
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => handleBulkAction('publish')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Content Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 capitalize">{activeSection}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeSection === 'banners' && 'Manage homepage banners and promotional content'}
                    {activeSection === 'legal' && 'Update terms, FAQs, policies and legal documents'}
                    {activeSection !== 'banners' && activeSection !== 'legal' && `Manage your ${activeSection} content and settings`}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {renderCurrentTable()}

            {/* Pagination */}
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} entries
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm cursor-pointer ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CMSManagement;
