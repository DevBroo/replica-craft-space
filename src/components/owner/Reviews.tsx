import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerService, type OwnerReview } from '@/lib/ownerService';
import { supabase } from '@/integrations/supabase/client';

interface ReviewsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Reviews: React.FC<ReviewsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last30days');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState('weekly');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
    { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  // Load reviews data
  useEffect(() => {
    if (user?.id) {
      loadReviews();
    }
  }, [user?.id]);

  // Real-time updates for reviews
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-reviews-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, (payload) => {
        console.log('⭐ Review updated:', payload);
        loadReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadReviews = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const ownerReviews = await OwnerService.getOwnerReviews(user.id);
      setReviews(ownerReviews);
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const responseRate = reviews.length > 0 ? (reviews.filter(r => r.response).length / reviews.length) * 100 : 0;

  const reviewsOverview = {
    averageRating: averageRating.toFixed(1),
    averageRatingChange: '0%',
    totalReviews: reviews.length.toString(),
    totalReviewsChange: '0',
    recentReviews: reviews.filter(r => new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length.toString(),
    recentReviewsChange: '0',
    responseRate: `${responseRate.toFixed(1)}%`,
    responseRateChange: '0%'
  };

  const propertiesData: any[] = [];

  // Filter reviews based on current filters
  const filteredReviews = reviews.filter(review => {
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'responded' && review.response) ||
      (statusFilter === 'pending' && !review.response);
    const matchesSearch = !searchQuery || 
      review.reviewer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.property_title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRating && matchesStatus && matchesSearch;
  });

  const ratingDistribution: any[] = [];

  const reviewTrendsData = {
    weekly: [],
    monthly: []
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      ></i>
    ));
  };



  useEffect(() => {
    // Rating Distribution Chart
    const ratingChart = echarts.init(document.getElementById('rating-chart'));
    const ratingOption = {
      animation: false,
      title: {
        text: 'Rating Distribution',
        left: 'left',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].name}: ${params[0].value} reviews (${ratingDistribution[params[0].dataIndex].percentage}%)`;
        }
      },
      xAxis: {
        type: 'category',
        data: ratingDistribution.map(item => item.rating),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [{
        data: ratingDistribution.map(item => item.count),
        type: 'bar',
        itemStyle: {
          color: '#F59E0B',
          borderRadius: [4, 4, 0, 0]
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
    ratingChart.setOption(ratingOption);

    // Review Trends Chart
    const trendsChart = echarts.init(document.getElementById('trends-chart'));
    const currentData = chartView === 'weekly' ? reviewTrendsData.weekly : reviewTrendsData.monthly;
    const trendsOption = {
      animation: false,
      title: {
        text: 'Review Trends',
        left: 'left',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].name}: ${params[0].value} reviews`;
        }
      },
      xAxis: {
        type: 'category',
        data: currentData.map(item => item.period),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [{
        data: currentData.map(item => item.reviews),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#10B981', width: 3 },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
          ])
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
    trendsChart.setOption(trendsOption);

    // Handle resize
    const handleResize = () => {
      ratingChart.resize();
      trendsChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ratingChart.dispose();
      trendsChart.dispose();
    };
  }, [chartView]);

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
          {menuItems.map((item) => (
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
              <h1 className="text-2xl font-semibold text-gray-800">Reviews Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Manage and respond to customer reviews</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-bell text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  src="https://readdy.ai/api/search-image?query=professional%20Indian%20property%20owner%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=owner-avatar-001&orientation=squarish"
                  alt="Owner Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">Rajesh Patel</span>
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Date Range:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('date-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>
                      {dateRange === 'last30days' ? 'Last 30 Days' :
                      dateRange === 'last7days' ? 'Last 7 Days' :
                      dateRange === 'thismonth' ? 'This Month' :
                      dateRange === 'lastmonth' ? 'Last Month' : 'This Year'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="date-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {[
                      { value: 'last7days', label: 'Last 7 Days' },
                      { value: 'last30days', label: 'Last 30 Days' },
                      { value: 'thismonth', label: 'This Month' },
                      { value: 'lastmonth', label: 'Last Month' },
                      { value: 'thisyear', label: 'This Year' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateRange(option.value);
                          document.getElementById('date-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Property:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('property-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>{propertyFilter === 'all' ? 'All Properties' : propertyFilter}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="property-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    <button
                      onClick={() => {
                        setPropertyFilter('all');
                        document.getElementById('property-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      All Properties
                    </button>
                    {propertiesData.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => {
                          setPropertyFilter(property.name);
                          document.getElementById('property-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {property.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap">
                <i className="fas fa-download mr-2"></i>
                Export Reviews
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap">
                <i className="fas fa-print mr-2"></i>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          {/* Reviews Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">{reviewsOverview.averageRating}</p>
                    <div className="flex space-x-1">
                      {renderStars(Math.round(parseFloat(reviewsOverview.averageRating)))}
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {reviewsOverview.averageRatingChange}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <i className="fas fa-star text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{reviewsOverview.totalReviews}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {reviewsOverview.totalReviewsChange}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-comments text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Reviews</p>
                  <p className="text-sm text-gray-500">(Last 30 days)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{reviewsOverview.recentReviews}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {reviewsOverview.recentReviewsChange}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-clock text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{reviewsOverview.responseRate}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {reviewsOverview.responseRateChange}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-reply text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div id="rating-chart" className="w-full h-80"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChartView('weekly')}
                    className={`px-3 py-1 rounded-lg text-sm cursor-pointer !rounded-button whitespace-nowrap ${
                      chartView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartView('monthly')}
                    className={`px-3 py-1 rounded-lg text-sm cursor-pointer !rounded-button whitespace-nowrap ${
                      chartView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <div id="trends-chart" className="w-full h-80"></div>
            </div>
          </div>

          {/* Reviews Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Customer Reviews</h3>
                <div className="text-sm text-gray-500">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    placeholder="Search reviews by guest name, property, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('rating-filter-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <i className="fas fa-star text-yellow-400"></i>
                    <span>{ratingFilter === 'all' ? 'All Ratings' : `${ratingFilter} Star`}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="rating-filter-dropdown" className="hidden absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    <button
                      onClick={() => {
                        setRatingFilter('all');
                        document.getElementById('rating-filter-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      All Ratings
                    </button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => {
                          setRatingFilter(rating.toString());
                          document.getElementById('rating-filter-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {rating} Star
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('status-filter-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <i className="fas fa-filter text-gray-400"></i>
                    <span>
                      {statusFilter === 'all' ? 'All Status' :
                      statusFilter === 'responded' ? 'Responded' : 'Pending'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="status-filter-dropdown" className="hidden absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        document.getElementById('status-filter-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('responded');
                        document.getElementById('status-filter-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Responded
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter('pending');
                        document.getElementById('status-filter-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      Pending
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Guest</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Property</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Rating</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Review</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                      <tr key={review.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <i className="fas fa-user text-gray-500"></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{review.reviewer_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <i className="fas fa-home text-gray-500"></i>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{review.property_title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 ml-2">{review.rating}.0</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="text-sm text-gray-900">
                            {expandedReviews.has(review.id) ? (
                              <div>
                                <p>{review.comment}</p>
                                <button
                                  onClick={() => toggleReviewExpansion(review.id)}
                                  className="text-blue-600 hover:text-blue-800 mt-1 text-xs cursor-pointer"
                                >
                                  Show less
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p>{review.comment.substring(0, 100)}...</p>
                                <button
                                  onClick={() => toggleReviewExpansion(review.id)}
                                  className="text-blue-600 hover:text-blue-800 mt-1 text-xs cursor-pointer"
                                >
                                  Read more
                                </button>
                              </div>
                            )}
                          </div>
                          {review.response && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                              <strong>Your response:</strong> {review.response}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-900">{new Date(review.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            review.response
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.response ? 'Responded' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 cursor-pointer !rounded-button whitespace-nowrap">
                              <i className="fas fa-reply mr-1"></i>
                              Reply
                            </button>
                            <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 cursor-pointer !rounded-button whitespace-nowrap">
                              <i className="fas fa-check mr-1"></i>
                              Mark Read
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <i className="fas fa-star text-gray-400 text-5xl"></i>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-gray-500 mb-4">Start getting reviews by adding properties and hosting guests.</p>
                            <button 
                              onClick={() => setActiveTab('properties')}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Add Your First Property
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;