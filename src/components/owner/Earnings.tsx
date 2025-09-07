import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as echarts from 'echarts';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerService, type OwnerEarnings } from '@/lib/ownerService';
import { NotificationService, type Notification } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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
  LogOut,
  UserCircle,
  X
} from 'lucide-react';

interface EarningsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  embedded?: boolean;
}

const Earnings: React.FC<EarningsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, embedded = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last30days');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [chartType, setChartType] = useState('monthly');
  const [earnings, setEarnings] = useState<OwnerEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'home' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar' },
    { id: 'earnings', label: 'Earnings', icon: 'dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'star' },
    { id: 'messages', label: 'Messages', icon: 'envelope' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  // Handler functions for interactive elements
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleExportReport = () => {
    // Create a simple CSV export
    const csvContent = `Date Range,Total Revenue,Monthly Earnings,Pending Payments,Completed Transactions
${dateRange},${earnings?.total_revenue || 0},${earnings?.monthly_earnings || 0},${earnings?.pending_payments || 0},${earnings?.completed_transactions || 0}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    setActiveTab('profile');
  };

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
      'chart-line': TrendingUp,
      'calendar-alt': Calendar,
      'clock': Bell,
      'check-circle': Star,
      'print': Download,
      'plus': TrendingUp,
      'log-out': LogOut,
      'user-circle': UserCircle,
    };
    
    const IconComponent = iconMap[iconName] || Home;
    return <IconComponent className={className} />;
  };

  // Load earnings, notifications, and properties data
  useEffect(() => {
    if (user?.id) {
      loadEarnings();
      loadNotifications();
      loadPropertiesData();
    }
  }, [user?.id]);

  // Close profile dropdown when clicking outside (backdrop handles notification dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Real-time updates for earnings and notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-earnings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('💰 Booking updated:', payload);
        loadEarnings();
        loadNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'commission_disbursements'
      }, (payload) => {
        console.log('💰 Commission updated:', payload);
        loadEarnings();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, (payload) => {
        console.log('⭐ Review updated:', payload);
        loadNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('🔔 Notification updated:', payload);
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadEarnings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const ownerEarnings = await OwnerService.getOwnerEarnings(user.id);
      setEarnings(ownerEarnings);
    } catch (error) {
      console.error('❌ Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setNotificationsLoading(true);
      const ownerNotifications = await NotificationService.getOwnerNotifications(user.id, 10);
      setNotifications(ownerNotifications);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadPropertiesData = async () => {
    if (!user?.id) return;
    
    try {
      // Get owner's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      if (propertiesError) {
        console.error('❌ Error fetching properties:', propertiesError);
        return;
      }

      // Get bookings for each property
      const propertiesWithData = await Promise.all(
        (properties || []).map(async (property) => {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('property_id', property.id)
            .eq('status', 'confirmed');

          const totalEarnings = bookings?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
          const bookingsCount = bookings?.length || 0;
          const averageRate = bookingsCount > 0 ? totalEarnings / bookingsCount : 0;
          const occupancyRate = bookingsCount > 0 ? `${Math.min(100, (bookingsCount * 10))}%` : '0%';

          return {
            id: property.id,
            name: property.title || 'Untitled Property',
            image: property.images?.[0] || 'https://via.placeholder.com/150',
            totalEarnings: `₹${totalEarnings.toLocaleString()}`,
            bookings: bookingsCount.toString(),
            averageRate: `₹${Math.round(averageRate).toLocaleString()}`,
            occupancyRate
          };
        })
      );

      setPropertiesData(propertiesWithData);

      // Generate sample chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = months.map((month, index) => ({
        month,
        revenue: Math.floor(Math.random() * 50000) + 10000
      }));
      setMonthlyRevenueData(monthlyData);

      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const weeklyData = weeks.map((week, index) => ({
        week,
        earnings: Math.floor(Math.random() * 15000) + 5000
      }));
      setWeeklyEarningsData(weeklyData);

      const paymentData = [
        { status: 'Paid', count: Math.floor(Math.random() * 20) + 10, amount: Math.floor(Math.random() * 100000) + 50000 },
        { status: 'Pending', count: Math.floor(Math.random() * 10) + 5, amount: Math.floor(Math.random() * 50000) + 20000 },
        { status: 'Overdue', count: Math.floor(Math.random() * 5) + 1, amount: Math.floor(Math.random() * 20000) + 5000 }
      ];
      setPaymentStatusData(paymentData);

    } catch (error) {
      console.error('❌ Error loading properties data:', error);
    }
  };

  const [propertiesData, setPropertiesData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [weeklyEarningsData, setWeeklyEarningsData] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);

  // Calculate percentage changes (mock data for now - in real app, compare with previous period)
  const calculateChange = (current: number, previous: number = 0) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const earningsData = {
    totalRevenue: `₹${earnings?.total_revenue?.toLocaleString() || '0'}`,
    totalRevenueChange: calculateChange(earnings?.total_revenue || 0, (earnings?.total_revenue || 0) * 0.8),
    monthlyEarnings: `₹${earnings?.monthly_earnings?.toLocaleString() || '0'}`,
    monthlyEarningsChange: calculateChange(earnings?.monthly_earnings || 0, (earnings?.monthly_earnings || 0) * 0.9),
    pendingPayments: `₹${earnings?.pending_payments?.toLocaleString() || '0'}`,
    pendingPaymentsChange: calculateChange(earnings?.pending_payments || 0, (earnings?.pending_payments || 0) * 1.1),
    completedTransactions: `${earnings?.completed_transactions || '0'}`,
    completedTransactionsChange: calculateChange(earnings?.completed_transactions || 0, (earnings?.completed_transactions || 0) * 0.85)
  };

  useEffect(() => {
    // Only render charts if there's data
    if (monthlyRevenueData.length === 0 && weeklyEarningsData.length === 0 && paymentStatusData.length === 0) {
      return;
    }

    // Monthly Revenue Chart
    const monthlyChart = echarts.init(document.getElementById('monthly-chart'));
    const monthlyOption = {
      animation: false,
      title: {
        text: 'Monthly Revenue Trend',
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
          return `${params[0].name}: ₹${params[0].value.toLocaleString()}`;
        }
      },
      xAxis: {
        type: 'category',
        data: monthlyRevenueData.map(item => item.month),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: {
          color: '#6B7280',
          formatter: (value: number) => `₹${value / 1000}K`
        },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [{
        data: monthlyRevenueData.map(item => item.revenue),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#3B82F6', width: 3 },
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
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
    monthlyChart.setOption(monthlyOption);

    // Weekly Earnings Chart
    const weeklyChart = echarts.init(document.getElementById('weekly-chart'));
    const weeklyOption = {
      animation: false,
      title: {
        text: 'Weekly Earnings Breakdown',
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
          return `${params[0].name}: ₹${params[0].value.toLocaleString()}`;
        }
      },
      xAxis: {
        type: 'category',
        data: weeklyEarningsData.map(item => item.week),
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280' }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisTick: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: {
          color: '#6B7280',
          formatter: (value: number) => `₹${value / 1000}K`
        },
        splitLine: { lineStyle: { color: '#F3F4F6' } }
      },
      series: [{
        data: weeklyEarningsData.map(item => item.earnings),
        type: 'bar',
        itemStyle: {
          color: '#10B981',
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
    weeklyChart.setOption(weeklyOption);

    // Payment Status Chart
    const paymentChart = echarts.init(document.getElementById('payment-chart'));
    const paymentOption = {
      animation: false,
      title: {
        text: 'Payment Status Distribution',
        left: 'left',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#374151'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}% ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: '0%',
        left: 'center'
      },
      series: [{
        name: 'Payment Status',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data: paymentStatusData.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    paymentChart.setOption(paymentOption);

    // Handle resize
    const handleResize = () => {
      monthlyChart.resize();
      weeklyChart.resize();
      paymentChart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      monthlyChart.dispose();
      weeklyChart.dispose();
      paymentChart.dispose();
    };
  }, []);

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
              <button 
                onClick={handleBackToHome}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                {renderIcon('arrow-left', 'w-4 h-4')}
                <span className="text-sm font-medium">Back to Home</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-semibold text-gray-800">Host Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <span>Welcome back, {user?.email || 'Owner'}</span>
              </div>
              <div className="relative notification-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer relative"
                >
                  {renderIcon('bell', 'w-5 h-5 text-gray-600')}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                </button>
                {showNotifications && createPortal(
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-25 z-[99998]"
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    
                    {/* Dropdown */}
                    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[99999] max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm mt-2">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                if (!notification.is_read) {
                                  NotificationService.markAsRead(notification.id);
                                  setNotifications(prev => 
                                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                                  );
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${!notification.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-4 border-t">
                        <button className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>
              <div className="relative profile-dropdown">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={user?.avatar_url || "https://readdy.ai/api/search-image?query=professional%20Indian%20property%20owner%20businessman%20avatar%20headshot%20with%20traditional%20modern%20fusion%20style%20confident%20expression&width=40&height=40&seq=owner-avatar-001&orientation=squarish"}
                    alt="Owner Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-gray-700">{user?.full_name || 'Owner'}</span>
                  {renderIcon('chevron-down', 'w-3 h-3 text-gray-400')}
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <button 
                        onClick={handleProfileClick}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                      >
                        {renderIcon('user-circle', 'w-4 h-4 text-gray-600')}
                        <span className="text-sm text-gray-700">Profile</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer flex items-center space-x-2"
                      >
                        {renderIcon('settings', 'w-4 h-4 text-gray-600')}
                        <span className="text-sm text-gray-700">Settings</span>
                      </button>
                      <div className="border-t my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer flex items-center space-x-2 text-red-600"
                      >
                        {renderIcon('log-out', 'w-4 h-4')}
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
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
                onClick={handleExportReport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                {renderIcon('download', 'w-4 h-4 mr-2')}
                Export Report
              </button>
              <button 
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                {renderIcon('print', 'w-4 h-4 mr-2')}
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
              <span className="ml-3 text-gray-600">Loading earnings data...</span>
            </div>
          ) : (
            <>
              {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.totalRevenue}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {earningsData.totalRevenueChange}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  {renderIcon('chart-line', 'w-6 h-6 text-blue-600')}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.monthlyEarnings}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {earningsData.monthlyEarningsChange}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  {renderIcon('calendar-alt', 'w-6 h-6 text-green-600')}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.pendingPayments}</p>
                  <p className="text-sm text-red-600 mt-1">
                    {renderIcon('arrow-down', 'w-3 h-3 mr-1')}
                    {earningsData.pendingPaymentsChange}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  {renderIcon('clock', 'w-6 h-6 text-yellow-600')}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.completedTransactions}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {renderIcon('arrow-up', 'w-3 h-3 mr-1')}
                    {earningsData.completedTransactionsChange}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  {renderIcon('check-circle', 'w-6 h-6 text-purple-600')}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Charts - Hidden */}
          {false && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setChartType('monthly')}
                    className={`px-3 py-1 rounded-lg text-sm cursor-pointer !rounded-button whitespace-nowrap ${
                      chartType === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartType('yearly')}
                    className={`px-3 py-1 rounded-lg text-sm cursor-pointer !rounded-button whitespace-nowrap ${
                      chartType === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div id="monthly-chart" className="w-full h-80"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div id="weekly-chart" className="w-full h-80"></div>
            </div>
          </div>
          )}

          {/* Property-wise Earnings and Payment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Property-wise Earnings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Property</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Earnings</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Bookings</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Avg Rate</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertiesData.length > 0 ? (
                      propertiesData.map((property) => (
                        <tr key={property.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <img
                                src={property.image}
                                alt={property.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                              <span className="text-sm font-medium text-gray-900">{property.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-semibold text-gray-900">{property.totalEarnings}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-900">{property.bookings}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-900">{property.averageRate}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: property.occupancyRate }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{property.occupancyRate}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            {renderIcon('chart-line', 'w-12 h-12 text-gray-400')}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings data</h3>
                              <p className="text-gray-500 mb-4">Start earning by adding properties and getting bookings.</p>
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div id="payment-chart" className="w-full h-80"></div>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Earnings;