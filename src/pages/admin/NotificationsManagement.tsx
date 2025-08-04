import React, { useState } from 'react';
import { 
  Download,
  ListChecks,
  Check,
  Mail,
  Archive,
  Trash2,
  X,
  Wrench,
  UserPlus,
  CalendarX,
  Shield,
  CreditCard,
  UserPen,
  Camera,
  Database,
  Star,
  ChevronDown,
  Search,
  Bell,
  Settings,
  Home
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';

const NotificationsManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    systemAlerts: true,
    userActivity: false,
    bookingUpdates: true,
    propertyApprovals: true,
    frequency: 'immediate',
    quietHours: false
  });

  const notificationsData = [
    {
      type: 'system',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur on July 30th from 2:00 AM to 4:00 AM EST. Some features may be temporarily unavailable.',
      timestamp: '2025-07-28T10:30:00Z',
      priority: 'high',
      status: 'unread',
      icon: Wrench,
      category: 'System Alerts'
    },
    {
      id: 'NT002',
      type: 'user',
      title: 'New User Registration',
      message: 'Sarah Johnson has registered as a new property owner and is awaiting approval.',
      timestamp: '2025-07-28T09:15:00Z',
      priority: 'medium',
      status: 'unread',
      icon: UserPlus,
      category: 'User Activity'
    },
    {
      id: 'NT003',
      type: 'booking',
      title: 'Booking Cancellation',
      message: 'Booking #BK2025-0892 for Villa Sunset has been cancelled by the guest. Refund processing required.',
      timestamp: '2025-07-28T08:45:00Z',
      priority: 'high',
      status: 'read',
      icon: CalendarX,
      category: 'Booking Updates'
    },
    {
      id: 'NT004',
      type: 'property',
      title: 'Property Approval Required',
      message: 'Luxury Beachfront Condo in Miami requires approval. All documentation has been submitted.',
      timestamp: '2025-07-28T07:20:00Z',
      priority: 'medium',
      status: 'unread',
      icon: Home,
      category: 'Property Approvals'
    },
    {
      id: 'NT005',
      type: 'system',
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100. Account has been temporarily locked.',
      timestamp: '2025-07-27T23:15:00Z',
      priority: 'high',
      status: 'read',
      icon: Shield,
      category: 'System Alerts'
    },
    {
      id: 'NT006',
      type: 'booking',
      title: 'Payment Confirmation',
      message: 'Payment of $2,450 received for booking #BK2025-0893. Guest check-in scheduled for August 1st.',
      timestamp: '2025-07-27T16:30:00Z',
      priority: 'low',
      status: 'read',
      icon: CreditCard,
      category: 'Booking Updates'
    },
    {
      id: 'NT007',
      type: 'user',
      title: 'Agent Profile Updated',
      message: 'Michael Chen has updated his agent profile with new certifications and contact information.',
      timestamp: '2025-07-27T14:45:00Z',
      priority: 'low',
      status: 'unread',
      icon: UserPen,
      category: 'User Activity'
    },
    {
      id: 'NT008',
      type: 'property',
      title: 'Property Photos Updated',
      message: 'Mountain View Cabin has uploaded 12 new high-resolution photos to their property listing.',
      timestamp: '2025-07-27T12:20:00Z',
      priority: 'low',
      status: 'read',
      icon: Camera,
      category: 'Property Approvals'
    },
    {
      id: 'NT009',
      type: 'system',
      title: 'Backup Completed',
      message: 'Daily system backup completed successfully. All data has been securely stored.',
      timestamp: '2025-07-27T03:00:00Z',
      priority: 'low',
      status: 'read',
      icon: Database,
      category: 'System Alerts'
    },
    {
      id: 'NT010',
      type: 'booking',
      title: 'Review Submitted',
      message: 'Guest Emma Wilson has submitted a 5-star review for Ocean View Villa. Review is pending moderation.',
      timestamp: '2025-07-26T19:30:00Z',
      priority: 'low',
      status: 'read',
      icon: Star,
      category: 'Booking Updates'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Notifications', count: notificationsData.length },
    { id: 'system', label: 'System Alerts', count: notificationsData.filter(n => n.type === 'system').length },
    { id: 'user', label: 'User Activity', count: notificationsData.filter(n => n.type === 'user').length },
    { id: 'booking', label: 'Booking Updates', count: notificationsData.filter(n => n.type === 'booking').length },
    { id: 'property', label: 'Property Approvals', count: notificationsData.filter(n => n.type === 'property').length }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'text-blue-600';
      case 'user': return 'text-purple-600';
      case 'booking': return 'text-green-600';
      case 'property': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const filteredNotifications = notificationsData.filter(notification => {
    const matchesCategory = activeCategory === 'all' || notification.type === activeCategory;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const notificationDate = new Date(notification.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    return matchesCategory && matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const totalPages = Math.ceil(filteredNotifications.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + rowsPerPage);
  const unreadCount = notificationsData.filter(n => n.status === 'unread').length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(paginatedNotifications.map(notification => notification.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    } else {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for notifications:`, selectedNotifications);
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  const handleMarkAsRead = (notificationId: string) => {
    console.log(`Mark notification ${notificationId} as read`);
  };

  const handleDeleteNotification = (notificationId: string) => {
    console.log(`Delete notification ${notificationId}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleSettingChange = (setting: string, value: boolean | string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Notifications Management" 
          breadcrumb="Notifications"
          searchPlaceholder="Search notifications..."
        />

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Notification Settings
              </button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {selectedNotifications.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap"
                  >
                    <ListChecks className="w-4 h-4 mr-2 inline" />
                    Bulk Actions ({selectedNotifications.length})
                    <ChevronDown className="w-4 h-4 ml-2 inline" />
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => handleBulkAction('read')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600"
                      >
                        <Check className="w-4 h-4 mr-2 inline" />
                        Mark as Read
                      </button>
                      <button
                        onClick={() => handleBulkAction('unread')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600"
                      >
                        <Mail className="w-4 h-4 mr-2 inline" />
                        Mark as Unread
                      </button>
                      <button
                        onClick={() => handleBulkAction('archive')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-yellow-600"
                      >
                        <Archive className="w-4 h-4 mr-2 inline" />
                        Archive
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2 inline" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap">
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b px-6">
          <div className="flex space-x-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setCurrentPage(1);
                  setSelectedNotifications([]);
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm cursor-pointer ${
                  activeCategory === category.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {category.label}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Notifications List */}
            <div className="divide-y divide-gray-200">
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-4"
                />
                <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Notification</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Time</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Notifications */}
              {paginatedNotifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      notification.status === 'unread' ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-4 mt-1"
                      />
                      <div className="flex-1 grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-6 flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(notification.type)} bg-opacity-10`}>
                            <IconComponent className={`w-4 h-4 ${getTypeColor(notification.type)}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                              {notification.status === 'unread' && (
                                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {notification.category}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <div className="col-span-1">
                          <div className="flex space-x-1">
                            {notification.status === 'unread' && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-green-600 hover:text-green-800 cursor-pointer p-1"
                                title="Mark as Read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
                  Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredNotifications.length)} of {filteredNotifications.length} entries
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm cursor-pointer !rounded-button whitespace-nowrap ${
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
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">General Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                      <p className="text-xs text-gray-500">Receive browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Category Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Category Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">System Alerts</label>
                      <p className="text-xs text-gray-500">Security, maintenance, and system updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => handleSettingChange('systemAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">User Activity</label>
                      <p className="text-xs text-gray-500">New registrations, profile updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.userActivity}
                        onChange={(e) => handleSettingChange('userActivity', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Booking Updates</label>
                      <p className="text-xs text-gray-500">New bookings, cancellations, payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.bookingUpdates}
                        onChange={(e) => handleSettingChange('bookingUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Property Approvals</label>
                      <p className="text-xs text-gray-500">Property submissions, approvals needed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.propertyApprovals}
                        onChange={(e) => handleSettingChange('propertyApprovals', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Frequency Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Notification Frequency</h4>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="immediate"
                      checked={notificationSettings.frequency === 'immediate'}
                      onChange={(e) => handleSettingChange('frequency', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700">Immediate</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="hourly"
                      checked={notificationSettings.frequency === 'hourly'}
                      onChange={(e) => handleSettingChange('frequency', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hourly Digest</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={notificationSettings.frequency === 'daily'}
                      onChange={(e) => handleSettingChange('frequency', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700">Daily Summary</span>
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quiet Hours</label>
                    <p className="text-xs text-gray-500">Disable notifications during specific hours</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.quietHours}
                      onChange={(e) => handleSettingChange('quietHours', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {notificationSettings.quietHours && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="time"
                      defaultValue="22:00"
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      defaultValue="08:00"
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer !rounded-button whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Save settings:', notificationSettings);
                  setShowSettings(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer !rounded-button whitespace-nowrap"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManagement;