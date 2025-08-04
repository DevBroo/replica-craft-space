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
  Search
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';

const CMSManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('cms');
  const [activeSection, setActiveSection] = useState('pages');
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

  const pagesData = [
    {
      id: 'PG001',
      title: 'Home Page',
      slug: '/home',
      status: 'Published',
      author: 'Admin User',
      lastModified: '2025-07-25',
      views: 12500,
      template: 'home-template',
      seoTitle: 'Picnify - Premium Property Rentals',
      metaDescription: 'Discover luxury vacation rentals and premium properties for your perfect getaway'
    },
    {
      id: 'PG002',
      title: 'About Us',
      slug: '/about',
      status: 'Published',
      author: 'Content Manager',
      lastModified: '2025-07-20',
      views: 3200,
      template: 'page-template',
      seoTitle: 'About Picnify - Your Trusted Property Partner',
      metaDescription: 'Learn about our mission to provide exceptional property rental experiences'
    },
    {
      id: 'PG003',
      title: 'Contact Us',
      slug: '/contact',
      status: 'Draft',
      author: 'Admin User',
      lastModified: '2025-07-28',
      views: 0,
      template: 'contact-template',
      seoTitle: 'Contact Picnify - Get in Touch',
      metaDescription: 'Contact our team for inquiries about property rentals and bookings'
    },
    {
      id: 'PG004',
      title: 'Privacy Policy',
      slug: '/privacy',
      status: 'Published',
      author: 'Legal Team',
      lastModified: '2025-07-15',
      views: 1800,
      template: 'legal-template',
      seoTitle: 'Privacy Policy - Picnify',
      metaDescription: 'Read our privacy policy and data protection practices'
    },
    {
      id: 'PG005',
      title: 'Terms of Service',
      slug: '/terms',
      status: 'Published',
      author: 'Legal Team',
      lastModified: '2025-07-15',
      views: 1200,
      template: 'legal-template',
      seoTitle: 'Terms of Service - Picnify',
      metaDescription: 'Review our terms of service and user agreement'
    }
  ];

  const blogPostsData = [
    {
      id: 'BP001',
      title: 'Top 10 Vacation Destinations for 2025',
      slug: '/blog/top-vacation-destinations-2025',
      status: 'Published',
      author: 'Travel Writer',
      publishDate: '2025-07-20',
      lastModified: '2025-07-22',
      views: 8500,
      category: 'Travel Tips',
      tags: ['vacation', 'travel', 'destinations'],
      featured: true,
      excerpt: 'Discover the most sought-after vacation destinations for the upcoming year',
      thumbnail: 'https://readdy.ai/api/search-image?query=beautiful%20tropical%20vacation%20destination%20with%20crystal%20clear%20water%20and%20pristine%20beaches%20professional%20travel%20photography&width=300&height=200&seq=blog-thumb-001&orientation=landscape'
    },
    {
      id: 'BP002',
      title: 'How to Choose the Perfect Rental Property',
      slug: '/blog/choose-perfect-rental-property',
      status: 'Published',
      author: 'Property Expert',
      publishDate: '2025-07-18',
      lastModified: '2025-07-19',
      views: 6200,
      category: 'Property Guide',
      tags: ['rental', 'property', 'guide'],
      featured: false,
      excerpt: 'Essential tips for selecting the ideal rental property for your needs',
      thumbnail: 'https://readdy.ai/api/search-image?query=modern%20luxury%20rental%20property%20interior%20with%20elegant%20furnishing%20and%20natural%20lighting%20professional%20real%20estate%20photography&width=300&height=200&seq=blog-thumb-002&orientation=landscape'
    },
    {
      id: 'BP003',
      title: 'Sustainable Travel: Eco-Friendly Accommodations',
      slug: '/blog/sustainable-travel-eco-friendly',
      status: 'Draft',
      author: 'Sustainability Writer',
      publishDate: '',
      lastModified: '2025-07-28',
      views: 0,
      category: 'Sustainability',
      tags: ['eco-friendly', 'sustainable', 'green'],
      featured: false,
      excerpt: 'Explore environmentally conscious accommodation options for responsible travelers',
      thumbnail: 'https://readdy.ai/api/search-image?query=eco-friendly%20sustainable%20accommodation%20with%20green%20architecture%20and%20natural%20materials%20professional%20architectural%20photography&width=300&height=200&seq=blog-thumb-003&orientation=landscape'
    },
    {
      id: 'BP004',
      title: 'Local Experiences: Hidden Gems in Popular Cities',
      slug: '/blog/local-experiences-hidden-gems',
      status: 'Published',
      author: 'Local Guide',
      publishDate: '2025-07-15',
      lastModified: '2025-07-16',
      views: 4800,
      category: 'Local Guide',
      tags: ['local', 'experiences', 'culture'],
      featured: true,
      excerpt: 'Uncover authentic local experiences beyond the typical tourist attractions',
      thumbnail: 'https://readdy.ai/api/search-image?query=authentic%20local%20cultural%20experience%20with%20traditional%20architecture%20and%20vibrant%20street%20scene%20professional%20travel%20photography&width=300&height=200&seq=blog-thumb-004&orientation=landscape'
    }
  ];

  const mediaData = [
    {
      id: 'MD001',
      name: 'hero-banner-home.jpg',
      type: 'image',
      size: '2.4 MB',
      dimensions: '1920x1080',
      uploadDate: '2025-07-25',
      usedIn: ['Home Page', 'Landing Page'],
      url: 'https://readdy.ai/api/search-image?query=luxury%20property%20hero%20banner%20with%20modern%20villa%20and%20stunning%20landscape%20professional%20real%20estate%20photography&width=400&height=300&seq=media-001&orientation=landscape'
    },
    {
      id: 'MD002',
      name: 'property-gallery-01.jpg',
      type: 'image',
      size: '1.8 MB',
      dimensions: '1200x800',
      uploadDate: '2025-07-24',
      usedIn: ['Property Listings'],
      url: 'https://readdy.ai/api/search-image?query=modern%20luxury%20property%20interior%20with%20elegant%20living%20room%20and%20premium%20furnishing%20professional%20real%20estate%20photography&width=400&height=300&seq=media-002&orientation=landscape'
    },
    {
      id: 'MD003',
      name: 'about-us-team.jpg',
      type: 'image',
      size: '1.2 MB',
      dimensions: '800x600',
      uploadDate: '2025-07-20',
      usedIn: ['About Page'],
      url: 'https://readdy.ai/api/search-image?query=professional%20business%20team%20in%20modern%20office%20environment%20with%20diverse%20group%20corporate%20photography&width=400&height=300&seq=media-003&orientation=landscape'
    },
    {
      id: 'MD004',
      name: 'promo-video.mp4',
      type: 'video',
      size: '45.2 MB',
      dimensions: '1920x1080',
      uploadDate: '2025-07-18',
      usedIn: ['Home Page', 'Marketing'],
      url: 'https://readdy.ai/api/search-image?query=video%20thumbnail%20with%20play%20button%20overlay%20showing%20luxury%20property%20marketing%20content%20professional%20style&width=400&height=300&seq=media-004&orientation=landscape'
    },
    {
      id: 'MD005',
      name: 'blog-featured-image.jpg',
      type: 'image',
      size: '900 KB',
      dimensions: '1000x667',
      uploadDate: '2025-07-15',
      usedIn: ['Blog Posts'],
      url: 'https://readdy.ai/api/search-image?query=featured%20blog%20image%20with%20travel%20and%20vacation%20theme%20showing%20beautiful%20destination%20professional%20travel%20photography&width=400&height=300&seq=media-005&orientation=landscape'
    }
  ];

  const settingsData = [
    {
      id: 'ST001',
      category: 'General',
      setting: 'Site Title',
      value: 'Picnify - Premium Property Rentals',
      type: 'text',
      description: 'Main title displayed in browser tab and search results'
    },
    {
      id: 'ST002',
      category: 'General',
      setting: 'Site Description',
      value: 'Discover luxury vacation rentals and premium properties',
      type: 'textarea',
      description: 'Brief description of your website for SEO purposes'
    },
    {
      id: 'ST003',
      category: 'Contact',
      setting: 'Contact Email',
      value: 'info@picnify.com',
      type: 'email',
      description: 'Primary contact email for customer inquiries'
    },
    {
      id: 'ST004',
      category: 'Social Media',
      setting: 'Facebook URL',
      value: 'https://facebook.com/picnify',
      type: 'url',
      description: 'Link to your Facebook business page'
    },
    {
      id: 'ST005',
      category: 'SEO',
      setting: 'Google Analytics ID',
      value: 'GA-XXXXXXXXX',
      type: 'text',
      description: 'Google Analytics tracking ID for website analytics'
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
      case 'pages': return pagesData;
      case 'blog': return blogPostsData;
      case 'media': return mediaData;
      case 'settings': return settingsData;
      default: return pagesData;
    }
  };

  const filteredData = getCurrentData().filter((item: any) => {
    const searchFields = activeSection === 'pages'
      ? [item.title, item.slug, item.author]
      : activeSection === 'blog'
      ? [item.title, item.slug, item.author, item.category]
      : activeSection === 'media'
      ? [item.name, item.type]
      : [item.setting, item.value, item.category];

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

  const renderPagesTable = () => (
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((page: any) => (
            <tr key={page.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(page.id)}
                  onChange={(e) => handleSelectItem(page.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  <div className="text-sm text-gray-500">{page.template}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {page.slug}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(page.status)}`}>
                  {page.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {page.author}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(page.lastModified).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {page.views.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(page)}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                    title="Edit Page"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-800 cursor-pointer p-1" title="View Page">
                    <Eye className="w-4 h-4" />
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

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Page
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
                placeholder="Search pages..."
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
            {renderPagesTable()}

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
