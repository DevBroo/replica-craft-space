import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerService, type OwnerEarnings } from '@/lib/ownerService';
import { supabase } from '@/integrations/supabase/client';

interface EarningsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Earnings: React.FC<EarningsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last30days');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [chartType, setChartType] = useState('monthly');
  const [earnings, setEarnings] = useState<OwnerEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'properties', label: 'My Properties', icon: 'fas fa-home' },
    { id: 'bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
    { id: 'earnings', label: 'Earnings', icon: 'fas fa-dollar-sign' },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
    { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  // Load earnings data
  useEffect(() => {
    if (user?.id) {
      loadEarnings();
    }
  }, [user?.id]);

  // Real-time updates for earnings
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-earnings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'commission_disbursements'
      }, (payload) => {
        console.log('💰 Commission updated:', payload);
        loadEarnings();
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

  const earningsData = {
    totalRevenue: `₹${earnings?.total_revenue?.toLocaleString() || '0'}`,
    totalRevenueChange: '0%',
    monthlyEarnings: `₹${earnings?.monthly_earnings?.toLocaleString() || '0'}`,
    monthlyEarningsChange: '0%',
    pendingPayments: `₹${earnings?.pending_payments?.toLocaleString() || '0'}`,
    pendingPaymentsChange: '0%',
    completedTransactions: `${earnings?.completed_transactions || '0'}`,
    completedTransactionsChange: '0%'
  };

  const propertiesData: any[] = [];

  const monthlyRevenueData: any[] = [];

  const weeklyEarningsData: any[] = [];

  const paymentStatusData: any[] = [];

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
              <h1 className="text-2xl font-semibold text-gray-800">Earnings Dashboard</h1>
              <div className="text-sm text-gray-500">
                <span>Financial overview and revenue analytics</span>
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
                Export Report
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
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.totalRevenue}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {earningsData.totalRevenueChange}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-chart-line text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.monthlyEarnings}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {earningsData.monthlyEarningsChange}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <i className="fas fa-calendar-alt text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.pendingPayments}</p>
                  <p className="text-sm text-red-600 mt-1">
                    <i className="fas fa-arrow-down mr-1"></i>
                    {earningsData.pendingPaymentsChange}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <i className="fas fa-clock text-yellow-600 text-xl"></i>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{earningsData.completedTransactions}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {earningsData.completedTransactionsChange}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-check-circle text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Charts */}
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
                            <i className="fas fa-chart-line text-gray-400 text-5xl"></i>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings data</h3>
                              <p className="text-gray-500 mb-4">Start earning by adding properties and getting bookings.</p>
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div id="payment-chart" className="w-full h-80"></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Earnings;