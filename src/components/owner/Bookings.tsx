import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { OwnerService, type OwnerBooking } from '@/lib/ownerService';
import { MessageService } from '@/lib/messageService';
import { NotificationService } from '@/lib/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Edit, 
  X, 
  MoreVertical, 
  MessageSquare, 
  Download, 
  Search,
  Filter,
  Calendar,
  User,
  Home,
  DollarSign
} from 'lucide-react';

interface BookingsProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  embedded?: boolean;
}

const Bookings: React.FC<BookingsProps> = ({ sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, embedded = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('checkin');
  const [dateRange, setDateRange] = useState('all');
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<OwnerBooking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<OwnerBooking | null>(null);
  const [editForm, setEditForm] = useState({
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    total_amount: 0,
    status: 'confirmed'
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const ownerBookings = await OwnerService.getOwnerBookings(user.id);
      setBookings(ownerBookings);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
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
  }, [user?.id]);

  // Load bookings data
  useEffect(() => {
    loadBookings();
    loadNotifications();
  }, [loadBookings, loadNotifications]);

  // Real-time updates for bookings and reviews
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-bookings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        console.log('📅 Booking updated - refreshing data');
        loadBookings();
        loadNotifications(); // Refresh notifications when bookings change
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, () => {
        console.log('⭐ Review updated - refreshing notifications');
        loadNotifications(); // Refresh notifications when reviews change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadBookings, loadNotifications]);

  // Escape key to close notifications dropdown (backdrop handles click outside)
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNotifications) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showNotifications]);

  // Action handlers
  const handleViewDetails = (booking: OwnerBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleSendMessage = async (booking: OwnerBooking) => {
    try {
      if (!user?.id || !booking.user_id) {
        toast({
          title: "Error",
          description: "Cannot send message: Guest information not available.",
          variant: "destructive",
        });
        return;
      }

      // Create or get message thread
      const thread = await MessageService.getOrCreateThread(
        booking.id,
        booking.property_id,
        booking.user_id,
        user.id
      );

      // Switch to messages tab
      setActiveTab('messages');
      
      toast({
        title: "Message Thread Created",
        description: "You can now send messages to this guest in the Messages tab.",
      });
    } catch (error) {
      console.error('Error creating message thread:', error);
      toast({
        title: "Error",
        description: "Failed to create message thread. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (booking: OwnerBooking) => {
    // Create invoice data
    const invoiceData = {
      bookingId: booking.id,
      guestName: booking.guest_name,
      propertyTitle: booking.property_title,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      amount: booking.total_amount,
      status: booking.status,
      date: new Date().toLocaleDateString()
    };

    // Create and download invoice
    const invoiceContent = `
INVOICE
Booking ID: ${invoiceData.bookingId}
Guest: ${invoiceData.guestName}
Property: ${invoiceData.propertyTitle}
Check-in: ${invoiceData.checkIn}
Check-out: ${invoiceData.checkOut}
Amount: ₹${invoiceData.amount}
Status: ${invoiceData.status}
Date: ${invoiceData.date}
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Invoice Downloaded",
      description: "Invoice has been downloaded successfully.",
    });
  };

  const handleEditBooking = (booking: OwnerBooking) => {
    setEditingBooking(booking);
    setEditForm({
      check_in_date: booking.check_in_date || '',
      check_out_date: booking.check_out_date || '',
      guests: booking.guests_count || 1,
      total_amount: booking.total_amount || 0,
      status: booking.status || 'confirmed'
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    try {
      // Calculate nights
      const checkIn = new Date(editForm.check_in_date);
      const checkOut = new Date(editForm.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      // Update booking
      const { error } = await supabase
        .from('bookings')
        .update({
          check_in_date: editForm.check_in_date,
          check_out_date: editForm.check_out_date,
          guests: editForm.guests,
          total_amount: editForm.total_amount,
          status: editForm.status
        })
        .eq('id', editingBooking.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Booking Updated",
        description: "The booking has been updated successfully.",
      });

      // Close modal and refresh bookings
      setShowEditModal(false);
      setEditingBooking(null);
      loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async (booking: OwnerBooking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        // Update booking status to cancelled
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Booking Cancelled",
          description: "The booking has been cancelled successfully.",
        });

        // Refresh bookings
        loadBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast({
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark notification as read
    if (!notification.is_read) {
      NotificationService.markAsRead(notification.id, user?.id);
      loadNotifications();
    }

    // Handle notification action
    if (notification.action_url) {
      // Navigate to specific booking or page
      if (notification.action_url.includes('booking')) {
        // Find and show booking details
        const bookingId = notification.action_url.split('/').pop();
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          handleViewDetails(booking);
        }
      }
    }
  };

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

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    // Enhanced search functionality - search by amount, guest name, property, booking ID
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (booking.guest_name || '').toLowerCase().includes(searchLower) ||
      (booking.id || '').toLowerCase().includes(searchLower) ||
      (booking.property_title || '').toLowerCase().includes(searchLower) ||
      (booking.total_amount?.toString() || '').includes(searchLower) ||
      (booking.guest_email || '').toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortBy) {
      case 'checkin':
        return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
      case 'guest':
        return a.guest_name.localeCompare(b.guest_name);
      case 'property':
        return a.property_title.localeCompare(b.property_title);
      case 'amount':
        return b.total_amount - a.total_amount;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = sortedBookings.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      )}

      {/* Main Content */}
      <div className={embedded ? "" : `transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-800">Bookings Management</h1>
              <div className="text-sm text-gray-500">
                <span>{filteredBookings.length} bookings found</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by guest, property, amount, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-80"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="notification-bell p-2 rounded-lg hover:bg-gray-100 cursor-pointer relative"
                >
                  <i className="fas fa-bell text-gray-600"></i>
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
                    ></div>
                    
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
                            <i className="fas fa-bell-slash text-gray-400 text-2xl mb-2"></i>
                            <p className="text-sm text-gray-500">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">You'll receive notifications about your properties and bookings here</p>
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
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('status-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>
                      {statusFilter === 'all' ? 'All Bookings' :
                      statusFilter === 'upcoming' ? 'Upcoming' :
                      statusFilter === 'ongoing' ? 'Ongoing' :
                      statusFilter === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="status-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {['all', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          document.getElementById('status-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {status === 'all' ? 'All Bookings' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                    <span>{dateRange === 'all' ? 'All Dates' : dateRange}</span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="date-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {['all', 'Today', 'This Week', 'This Month'].map((range) => (
                      <button
                        key={range}
                        onClick={() => {
                          setDateRange(range);
                          document.getElementById('date-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {range === 'all' ? 'All Dates' : range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('sort-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <span>
                      {sortBy === 'checkin' ? 'Check-in Date' :
                      sortBy === 'guest' ? 'Guest Name' :
                      sortBy === 'property' ? 'Property Name' : 'Amount'}
                    </span>
                    <i className="fas fa-chevron-down text-gray-400"></i>
                  </button>
                  <div id="sort-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                    {[
                      { value: 'checkin', label: 'Check-in Date' },
                      { value: 'guest', label: 'Guest Name' },
                      { value: 'property', label: 'Property Name' },
                      { value: 'amount', label: 'Amount' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          document.getElementById('sort-dropdown')?.classList.add('hidden');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Create Booking Button - Commented out as requested */}
            {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer !rounded-button whitespace-nowrap">
              <i className="fas fa-plus mr-2"></i>
              Add New Booking
            </button> */}
          </div>
        </div>

        {/* Bookings Table */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Booking ID</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Guest</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Property</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Check-in</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Check-out</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Payment</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Amount</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Loading bookings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentBookings.length > 0 ? (
                    currentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">{booking.id}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <i className="fas fa-user text-gray-600 text-sm"></i>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{booking.guest_name}</p>
                              <p className="text-xs text-gray-500">{booking.guests_count} guests</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.property_title}</p>
                            <p className="text-xs text-gray-500">{booking.nights} nights</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-900">{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-900">{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status || 'unknown')}`}>
                            {(booking.status || 'unknown').charAt(0).toUpperCase() + (booking.status || 'unknown').slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor('paid')}`}>
                            Paid
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-900">₹{(booking.total_amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(booking)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditBooking(booking)}
                              className="text-green-600 hover:text-green-800 cursor-pointer p-1 rounded hover:bg-green-50"
                              title="Edit Booking"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                              <button 
                                onClick={() => handleCancelBooking(booking)}
                                className="text-red-600 hover:text-red-800 cursor-pointer p-1 rounded hover:bg-red-50"
                                title="Cancel Booking"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  const dropdown = document.getElementById(`action-${booking.id}`);
                                  if (dropdown) {
                                    dropdown.classList.toggle('hidden');
                                  }
                                }}
                                className="text-gray-600 hover:text-gray-800 cursor-pointer p-1 rounded hover:bg-gray-50"
                                title="More Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              <div id={`action-${booking.id}`} className="hidden absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
                                <button 
                                  onClick={() => {
                                    handleViewDetails(booking);
                                    document.getElementById(`action-${booking.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm flex items-center space-x-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Details</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    handleSendMessage(booking);
                                    document.getElementById(`action-${booking.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm flex items-center space-x-2"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Send Message</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    handleDownloadInvoice(booking);
                                    document.getElementById(`action-${booking.id}`)?.classList.add('hidden');
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm flex items-center space-x-2"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Download Invoice</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <i className="fas fa-calendar-times text-gray-400 text-5xl"></i>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                            <p className="text-gray-500 mb-4">You don't have any bookings yet. Start by adding properties to get bookings.</p>
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

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show</span>
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('items-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <span>{itemsPerPage}</span>
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </button>
                <div id="items-dropdown" className="hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                  {[10, 25, 50, 100].map((items) => (
                    <button
                      key={items}
                      onClick={() => {
                        setItemsPerPage(items);
                        setCurrentPage(1);
                        document.getElementById('items-dropdown')?.classList.add('hidden');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {items}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedBookings.length)} of {sortedBookings.length} entries
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-lg cursor-pointer !rounded-button whitespace-nowrap ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button whitespace-nowrap"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-medium">{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status || 'unknown')}`}>
                        {(selectedBooking.status || 'unknown').charAt(0).toUpperCase() + (selectedBooking.status || 'unknown').slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor('paid')}`}>
                        Paid
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">₹{(selectedBooking.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guest Name:</span>
                      <span className="font-medium">{selectedBooking.guest_name || 'Unknown Guest'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedBooking.guest_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedBooking.guest_phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of Guests:</span>
                      <span className="font-medium">{selectedBooking.guests_count || 1}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property:</span>
                    <span className="font-medium">{selectedBooking.property_title || 'Unknown Property'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in Date:</span>
                    <span className="font-medium">
                      {selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out Date:</span>
                    <span className="font-medium">
                      {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Nights:</span>
                    <span className="font-medium">{selectedBooking.nights || 0}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    handleSendMessage(selectedBooking);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    handleDownloadInvoice(selectedBooking);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Invoice</span>
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Booking</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={editForm.check_in_date}
                        onChange={(e) => setEditForm({...editForm, check_in_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={editForm.check_out_date}
                        onChange={(e) => setEditForm({...editForm, check_out_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Guests
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.guests}
                        onChange={(e) => setEditForm({...editForm, guests: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment & Status</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.total_amount}
                        onChange={(e) => setEditForm({...editForm, total_amount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Booking Information</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Booking ID: {editingBooking.id}</div>
                        <div>Guest: {editingBooking.guest_name}</div>
                        <div>Property: {editingBooking.property_title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Update Booking</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;