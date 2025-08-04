import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

interface ReviewsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Reviews: React.FC<ReviewsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const [dateRange, setDateRange] = useState('last30days');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState('weekly');
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const toggleReviewExpansion = (reviewId: number) => {
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

  const reviewsOverview = {
    averageRating: '4.6',
    averageRatingChange: '+0.2',
    totalReviews: '342',
    totalReviewsChange: '+18',
    recentReviews: '28',
    recentReviewsChange: '+12',
    responseRate: '94%',
    responseRateChange: '+3%'
  };

  const propertiesData = [
    { id: 1, name: 'Oceanview Villa' },
    { id: 2, name: 'Goa Beach House' },
    { id: 3, name: 'Jaipur Heritage' },
    { id: 4, name: 'Pune Penthouse' },
    { id: 5, name: 'Chennai Marina' },
    { id: 6, name: 'Delhi Apartment' }
  ];

  const reviewsData = [
    {
      id: 1,
      guestName: 'Priya Sharma',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20woman%20guest%20avatar%20headshot%20with%20friendly%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-001&orientation=squarish',
      propertyName: 'Oceanview Villa',
      propertyImage: 'https://readdy.ai/api/search-image?query=luxury%20oceanview%20villa%20property%20exterior%20modern%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-001&orientation=squarish',
      rating: 5,
      reviewText: 'Absolutely stunning property with breathtaking ocean views! The villa was immaculately clean and well-maintained. The host was incredibly responsive and provided excellent recommendations for local attractions. The infinity pool overlooking the ocean was the highlight of our stay.',
      date: '2024-01-15',
      status: 'responded',
      responseText: 'Thank you so much for your wonderful review, Priya! We are delighted that you enjoyed your stay.'
    },
    {
      id: 2,
      guestName: 'Amit Kumar',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20man%20guest%20avatar%20headshot%20with%20friendly%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-002&orientation=squarish',
      propertyName: 'Goa Beach House',
      propertyImage: 'https://readdy.ai/api/search-image?query=beautiful%20beach%20house%20property%20coastal%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-002&orientation=squarish',
      rating: 4,
      reviewText: 'Great location right on the beach with easy access to water sports and local restaurants. The house was comfortable and had all necessary amenities. Only minor issue was the WiFi connectivity in some rooms.',
      date: '2024-01-12',
      status: 'pending',
      responseText: null
    },
    {
      id: 3,
      guestName: 'Sarah Johnson',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20western%20woman%20guest%20avatar%20headshot%20with%20friendly%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-003&orientation=squarish',
      propertyName: 'Jaipur Heritage',
      propertyImage: 'https://readdy.ai/api/search-image?query=traditional%20heritage%20property%20rajasthani%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-003&orientation=squarish',
      rating: 5,
      reviewText: 'An authentic Rajasthani experience! The heritage property beautifully captures the essence of Jaipur with traditional architecture and modern comforts. The rooftop terrace offers spectacular views of the city.',
      date: '2024-01-10',
      status: 'responded',
      responseText: 'Thank you Sarah! We are thrilled you enjoyed the authentic Rajasthani experience.'
    },
    {
      id: 4,
      guestName: 'Ravi Patel',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20businessman%20guest%20avatar%20headshot%20with%20confident%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-004&orientation=squarish',
      propertyName: 'Pune Penthouse',
      propertyImage: 'https://readdy.ai/api/search-image?query=modern%20penthouse%20property%20contemporary%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-004&orientation=squarish',
      rating: 3,
      reviewText: 'The penthouse has great potential with amazing city views, but there were some maintenance issues during our stay. The elevator was out of service for two days which was inconvenient.',
      date: '2024-01-08',
      status: 'pending',
      responseText: null
    },
    {
      id: 5,
      guestName: 'Lisa Chen',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20asian%20woman%20guest%20avatar%20headshot%20with%20friendly%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-005&orientation=squarish',
      propertyName: 'Chennai Marina',
      propertyImage: 'https://readdy.ai/api/search-image?query=marina%20waterfront%20property%20coastal%20modern%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-005&orientation=squarish',
      rating: 4,
      reviewText: 'Perfect location near Marina Beach with excellent connectivity to the city center. The apartment was clean and well-furnished. Would definitely recommend for business travelers.',
      date: '2024-01-05',
      status: 'responded',
      responseText: 'Thank you Lisa! We appreciate your recommendation and look forward to hosting you again.'
    },
    {
      id: 6,
      guestName: 'Vikram Singh',
      guestAvatar: 'https://readdy.ai/api/search-image?query=professional%20Indian%20young%20man%20guest%20avatar%20headshot%20with%20friendly%20expression%20clean%20background%20modern%20style&width=40&height=40&seq=guest-006&orientation=squarish',
      propertyName: 'Delhi Apartment',
      propertyImage: 'https://readdy.ai/api/search-image?query=urban%20apartment%20property%20modern%20city%20architecture%20with%20clean%20minimalist%20background%20bright%20natural%20lighting&width=60&height=60&seq=property-006&orientation=squarish',
      rating: 2,
      reviewText: 'The location is convenient but the apartment needs significant improvements. The air conditioning was not working properly and there were cleanliness issues upon arrival.',
      date: '2024-01-03',
      status: 'pending',
      responseText: null
    }
  ];

  const ratingDistribution = [
    { rating: '5 Star', count: 156, percentage: 45.6 },
    { rating: '4 Star', count: 98, percentage: 28.7 },
    { rating: '3 Star', count: 52, percentage: 15.2 },
    { rating: '2 Star', count: 24, percentage: 7.0 },
    { rating: '1 Star', count: 12, percentage: 3.5 }
  ];

  const reviewTrendsData = {
    weekly: [
      { period: 'Week 1', reviews: 8 },
      { period: 'Week 2', reviews: 12 },
      { period: 'Week 3', reviews: 15 },
      { period: 'Week 4', reviews: 18 }
    ],
    monthly: [
      { period: 'Oct', reviews: 45 },
      { period: 'Nov', reviews: 52 },
      { period: 'Dec', reviews: 48 },
      { period: 'Jan', reviews: 38 }
    ]
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      ></i>
    ));
  };

  const filteredReviews = reviewsData.filter(review => {
    const matchesSearch = review.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesProperty = propertyFilter === 'all' || review.propertyName === propertyFilter;
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesRating && matchesProperty && matchesStatus;
  });

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
                  Showing {filteredReviews.length} of {reviewsData.length} reviews
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
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={review.guestAvatar}
                            alt={review.guestName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium text-gray-900">{review.guestName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <img
                            src={review.propertyImage}
                            alt={review.propertyName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span className="text-sm font-medium text-gray-900">{review.propertyName}</span>
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
                              <p>{review.reviewText}</p>
                              <button
                                onClick={() => toggleReviewExpansion(review.id)}
                                className="text-blue-600 hover:text-blue-800 mt-1 text-xs cursor-pointer"
                              >
                                Show less
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p>{review.reviewText.substring(0, 100)}...</p>
                              <button
                                onClick={() => toggleReviewExpansion(review.id)}
                                className="text-blue-600 hover:text-blue-800 mt-1 text-xs cursor-pointer"
                              >
                                Read more
                              </button>
                            </div>
                          )}
                        </div>
                        {review.status === 'responded' && review.responseText && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                            <strong>Your response:</strong> {review.responseText}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{new Date(review.date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.status === 'responded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.status === 'responded' ? 'Responded' : 'Pending'}
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
                  ))}
                </tbody>
              </table>
            </div>
            {filteredReviews.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-500">No reviews found matching your criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;