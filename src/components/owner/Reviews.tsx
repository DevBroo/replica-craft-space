import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as echarts from 'echarts';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerService, type OwnerReview } from '@/lib/ownerService';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  Star, 
  User, 
  Settings, 
  Menu, 
  Bell, 
  ChevronDown,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Reply,
  Clock,
  MessageSquare,
  Plus,
  CheckCircle,
  Printer,
  X
} from 'lucide-react';

interface ReviewsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  embedded?: boolean;
}

const Reviews: React.FC<ReviewsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, embedded = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('last30days');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState('weekly');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<OwnerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'home' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar' },
    { id: 'earnings', label: 'Earnings', icon: 'dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'star' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'tachometer-alt': Home,
      'home': Home,
      'calendar': Calendar,
      'dollar-sign': DollarSign,
      'star': Star,
      'user': User,
      'settings': Settings,
      'envelope': Bell,
      'menu': Menu,
      'bell': Bell,
      'chevron-down': ChevronDown,
      'arrow-left': ArrowLeft,
      'download': Download,
      'trending-up': TrendingUp,
      'trending-down': TrendingDown,
      'arrow-up': TrendingUp,
      'arrow-down': TrendingDown,
      'search': Search,
      'filter': Filter,
      'reply': Reply,
      'clock': Clock,
      'comments': MessageSquare,
      'plus': Plus,
      'check-circle': CheckCircle,
      'printer': Printer,
    };
    
    const IconComponent = iconMap[iconName] || Home;
    return <IconComponent className={className} />;
  };

  // Load reviews data
  useEffect(() => {
    if (user?.id) {
      loadReviews();
      loadPropertiesData();
      loadNotifications();
    }
  }, [user?.id, dateRange, propertyFilter, ratingFilter, statusFilter]);

  // Load notifications on component mount
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Generate chart data when reviews change
  useEffect(() => {
    generateChartData();
  }, [reviews]);

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

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setNotificationsLoading(true);
      const userNotifications = await NotificationService.getUserNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark notification as read
    if (!notification.is_read) {
      NotificationService.markAsRead(notification.id, user?.id);
      loadNotifications();
    }

    // Handle notification action
    if (notification.action_url) {
      // Navigate to specific review or page
      if (notification.action_url.includes('review')) {
        // Find and show review details
        const reviewId = notification.action_url.split('/').pop();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          // You could implement a review detail modal here
          console.log('Review clicked:', review);
        }
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      if (!user?.id) return;
      
      // Get all notification IDs
      const allNotificationIds = notifications.map(n => n.id);
      
      // Mark all notifications as read in localStorage
      await NotificationService.markAllAsRead(user.id, allNotificationIds);
      
      // Reload notifications to reflect the changes
      loadNotifications();
      
      toast({
        title: "All Notifications Marked as Read",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read.",
        variant: "destructive",
      });
    }
  };

  const handleExportReviews = () => {
    try {
      const csvContent = [
        ['Guest Name', 'Property', 'Rating', 'Review', 'Date', 'Status'],
        ...filteredReviews.map(review => [
          review.reviewer_name || '',
          review.property_title || '',
          review.rating.toString(),
          review.comment || '',
          new Date(review.created_at).toLocaleDateString(),
          review.response ? 'Responded' : 'Pending'
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reviews-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Error exporting reviews:', error);
    }
  };

  const handlePrintReviews = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const printContent = `
          <html>
            <head>
              <title>Reviews Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Reviews Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                <p>Total Reviews: ${filteredReviews.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Property</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredReviews.map(review => `
                    <tr>
                      <td>${review.reviewer_name || ''}</td>
                      <td>${review.property_title || ''}</td>
                      <td>${review.rating}</td>
                      <td>${review.comment || ''}</td>
                      <td>${new Date(review.created_at).toLocaleDateString()}</td>
                      <td>${review.response ? 'Responded' : 'Pending'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('❌ Error printing reviews:', error);
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

  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [reviewTrendsData, setReviewTrendsData] = useState<{
    weekly: any[];
    monthly: any[];
  }>({ weekly: [], monthly: [] });

  // Load properties data
  const loadPropertiesData = async () => {
    if (!user?.id) return;
    
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (error) {
        console.error('❌ Error fetching properties:', error);
        return;
      }

      const propertiesWithData = (properties || []).map(property => ({
        id: property.id,
        name: property.title || 'Untitled Property'
      }));

      setPropertiesData(propertiesWithData);
    } catch (error) {
      console.error('❌ Error loading properties data:', error);
    }
  };

  // Generate chart data from reviews
  const generateChartData = () => {
    if (reviews.length === 0) {
      setRatingDistribution([]);
      setReviewTrendsData({ weekly: [], monthly: [] });
      return;
    }

    // Generate rating distribution
    const ratingDist = [1, 2, 3, 4, 5].map(rating => {
      const count = reviews.filter(r => r.rating === rating).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { rating: `${rating}★`, count, percentage: percentage.toFixed(1) };
    });
    setRatingDistribution(ratingDist);

    // Generate weekly trends (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekReviews = reviews.filter(r => {
        const reviewDate = new Date(r.created_at);
        return reviewDate >= weekStart && reviewDate <= weekEnd;
      }).length;
      
      weeklyData.push({
        period: `Week ${4 - i}`,
        reviews: weekReviews
      });
    }

    // Generate monthly trends (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      
      const monthReviews = reviews.filter(r => {
        const reviewDate = new Date(r.created_at);
        return reviewDate >= monthStart && reviewDate <= monthEnd;
      }).length;
      
      monthlyData.push({
        period: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        reviews: monthReviews
      });
    }

    setReviewTrendsData({ weekly: weeklyData, monthly: monthlyData });
  };

  // Filter reviews based on current filters
  const filteredReviews = reviews.filter(review => {
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'responded' && review.response) ||
      (statusFilter === 'pending' && !review.response);
    const matchesSearch = !searchQuery || 
      (review.reviewer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.property_title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRating && matchesStatus && matchesSearch;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };



  useEffect(() => {
    // Only render charts if there's data
    if (ratingDistribution.length === 0 && reviewTrendsData.weekly.length === 0 && reviewTrendsData.monthly.length === 0) {
      return;
    }

    // Rating Distribution Chart
    const ratingChartElement = document.getElementById('rating-chart');
    if (ratingChartElement) {
      const ratingChart = echarts.init(ratingChartElement);
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
            if (ratingDistribution.length > 0 && params[0]) {
              return `${params[0].name}: ${params[0].value} reviews (${ratingDistribution[params[0].dataIndex]?.percentage || 0}%)`;
            }
            return 'No data available';
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
    }

    // Review Trends Chart
    const trendsChartElement = document.getElementById('trends-chart');
    if (trendsChartElement) {
      const trendsChart = echarts.init(trendsChartElement);
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
            if (params[0]) {
              return `${params[0].name}: ${params[0].value} reviews`;
            }
            return 'No data available';
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
    }

    // Handle resize
    const handleResize = () => {
      const ratingChartElement = document.getElementById('rating-chart');
      const trendsChartElement = document.getElementById('trends-chart');
      if (ratingChartElement) {
        const ratingChart = echarts.getInstanceByDom(ratingChartElement);
        if (ratingChart) ratingChart.resize();
      }
      if (trendsChartElement) {
        const trendsChart = echarts.getInstanceByDom(trendsChartElement);
        if (trendsChart) trendsChart.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      const ratingChartElement = document.getElementById('rating-chart');
      const trendsChartElement = document.getElementById('trends-chart');
      if (ratingChartElement) {
        const ratingChart = echarts.getInstanceByDom(ratingChartElement);
        if (ratingChart) ratingChart.dispose();
      }
      if (trendsChartElement) {
        const trendsChart = echarts.getInstanceByDom(trendsChartElement);
        if (trendsChart) trendsChart.dispose();
      }
    };
  }, [chartView, ratingDistribution, reviewTrendsData]);

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50"}>
      {/* Sidebar - only show if not embedded */}
      {!embedded && (
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
              {renderIcon('menu', 'w-5 h-5 text-gray-600')}
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
                {renderIcon(item.icon, 'w-5 h-5 text-center')}
                {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className={embedded ? "" : `transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
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
              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  {renderIcon('bell', 'w-5 h-5 text-gray-600')}
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown - Portal Based */}
                {showNotifications && createPortal(
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-25 z-[99998]"
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[99999] max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center space-x-2">
                            {notifications.filter(n => !n.is_read).length > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                Mark all as read
                              </button>
                            )}
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center">
                            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">You'll receive notifications about your reviews and properties here</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                !notification.is_read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.is_read ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-4 border-t">
                          <button
                            onClick={() => setActiveTab('messages')}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>
              <div className="flex items-center space-x-2">
                {user?.avatar_url ? (
                  <img
                    key={user.avatar_url}
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'H'}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.full_name || user?.email || 'Host'}
                </span>
                {renderIcon('chevron-down', 'w-3 h-3 text-gray-400')}
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
                    {renderIcon('chevron-down', 'w-4 h-4 text-gray-400')}
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
                    {renderIcon('chevron-down', 'w-4 h-4 text-gray-400')}
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
              <button 
                onClick={handleExportReviews}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                {renderIcon('download', 'w-4 h-4 mr-2')}
                Export Reviews
              </button>
              <button 
                onClick={handlePrintReviews}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                {renderIcon('printer', 'w-4 h-4 mr-2')}
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading reviews data...</span>
            </div>
          ) : (
            <>
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
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {reviewsOverview.averageRatingChange}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  {renderIcon('star', 'w-6 h-6 text-yellow-600')}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{reviewsOverview.totalReviews}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {reviewsOverview.totalReviewsChange}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  {renderIcon('comments', 'w-6 h-6 text-blue-600')}
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
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {reviewsOverview.recentReviewsChange}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  {renderIcon('clock', 'w-6 h-6 text-green-600')}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{reviewsOverview.responseRate}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {reviewsOverview.responseRateChange}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  {renderIcon('reply', 'w-6 h-6 text-purple-600')}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Analytics - Hidden */}
          {false && (
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
          )}

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
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {renderIcon('search', 'w-4 h-4')}
                  </div>
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
                    {renderIcon('star', 'w-4 h-4 text-yellow-400')}
                    <span>{ratingFilter === 'all' ? 'All Ratings' : `${ratingFilter} Star`}</span>
                    {renderIcon('chevron-down', 'w-4 h-4 text-gray-400')}
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
                    {renderIcon('filter', 'w-4 h-4 text-gray-400')}
                    <span>
                      {statusFilter === 'all' ? 'All Status' :
                      statusFilter === 'responded' ? 'Responded' : 'Pending'}
                    </span>
                    {renderIcon('chevron-down', 'w-4 h-4 text-gray-400')}
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
                              {renderIcon('user', 'w-5 h-5 text-gray-500')}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{review.reviewer_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              {renderIcon('home', 'w-5 h-5 text-gray-500')}
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
                              {renderIcon('reply', 'w-3 h-3 mr-1')}
                              Reply
                            </button>
                            <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 cursor-pointer !rounded-button whitespace-nowrap">
                              {renderIcon('check-circle', 'w-3 h-3 mr-1')}
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
                          {renderIcon('star', 'w-16 h-16 text-gray-400')}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-gray-500 mb-4">Start getting reviews by adding properties and hosting guests.</p>
                            <button 
                              onClick={() => setActiveTab('properties')}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              {renderIcon('plus', 'w-4 h-4 mr-2')}
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reviews;