import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus,
  Check,
  Eye,
  X,
  Trash2,
  ArrowUpDown,
  CalendarCheck,
  CalendarX,
  ListChecks,
  ChevronDown,
  Search,
  Home,
  Edit,
  TrendingUp,
  DollarSign,
  CreditCard,
  RefreshCw,
  AlertCircle,
  User,
  Users,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import IconButton from '../../components/admin/ui/IconButton';
import { toast } from '../../components/admin/ui/use-toast';

interface BookingData {
  id: string;
  created_at: string;
  updated_at: string;
  property_id: string;
  property_title: string;
  user_id: string;
  user_name: string;
  owner_id: string;
  owner_name: string;
  agent_id?: string;
  agent_name?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
  refund_status: string;
  refund_amount: number;
}

interface BookingAnalytics {
  total_bookings: number;
  total_revenue: number;
  average_booking_value: number;
  bookings_by_status: Record<string, number>;
  payments_by_status: Record<string, number>;
  refunds: {
    total_refund_amount: number;
    by_status: Record<string, number>;
  };
  cancellations: number;
}

const BookingManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [refundFilter, setRefundFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'check_in_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const queryClient = useQueryClient();

  // Fetch booking analytics
  const { data: analytics } = useQuery({
    queryKey: ['booking-analytics', dateFrom, dateTo],
    queryFn: async () => {
      const startDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = dateTo || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_booking_analytics_detailed', {
        start_date: startDate,
        end_date: endDate
      });

      if (error) throw error;
      return data[0] as BookingAnalytics;
    }
  });

  // Fetch bookings with filters
  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['bookings-admin', {
      search: searchTerm,
      status: statusFilter,
      payment: paymentFilter,
      refund: refundFilter,
      property: propertyFilter,
      user: userFilter,
      owner: ownerFilter,
      agent: agentFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page: currentPage,
      limit: rowsPerPage
    }],
    queryFn: async () => {
      let query = supabase.from('booking_admin_list').select('*');

      // Apply filters
      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%,property_title.ilike.%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }
      if (refundFilter !== 'all') {
        query = query.eq('refund_status', refundFilter);
      }
      if (propertyFilter) {
        query = query.ilike('property_title', `%${propertyFilter}%`);
      }
      if (userFilter) {
        query = query.ilike('user_name', `%${userFilter}%`);
      }
      if (ownerFilter) {
        query = query.ilike('owner_name', `%${ownerFilter}%`);
      }
      if (agentFilter && agentFilter !== 'none') {
        if (agentFilter === 'has_agent') {
          query = query.not('agent_id', 'is', null);
        } else {
          query = query.ilike('agent_name', `%${agentFilter}%`);
        }
      } else if (agentFilter === 'none') {
        query = query.is('agent_id', null);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      return data as BookingData[];
    }
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookingData> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['booking-analytics'] });
      toast({ title: 'Success', description: 'Booking updated successfully' });
    },
    onError: (error) => {
      console.error('Error updating booking:', error);
      toast({ title: 'Error', description: 'Failed to update booking', variant: 'destructive' });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<BookingData> }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['booking-analytics'] });
      setSelectedBookings([]);
      setShowBulkActions(false);
      toast({ title: 'Success', description: 'Bookings updated successfully' });
    },
    onError: (error) => {
      console.error('Error bulk updating bookings:', error);
      toast({ title: 'Error', description: 'Failed to update bookings', variant: 'destructive' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(bookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedBookings.length === 0) return;

    let updates: Partial<BookingData> = {};
    
    switch (action) {
      case 'confirm':
        updates = { status: 'confirmed' };
        break;
      case 'cancel':
        updates = { status: 'cancelled' };
        break;
      case 'mark-paid':
        updates = { payment_status: 'paid' };
        break;
      case 'mark-failed':
        updates = { payment_status: 'failed' };
        break;
      default:
        return;
    }

    bulkUpdateMutation.mutate({ ids: selectedBookings, updates });
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBookingDetails(booking);
    setShowDetailsDrawer(true);
  };

  const handleUpdateBooking = (id: string, field: string, value: any) => {
    updateBookingMutation.mutate({ id, updates: { [field]: value } });
  };

  const handleSort = (field: 'created_at' | 'total_amount' | 'check_in_date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Booking Management" 
          breadcrumb="Booking Management"
          searchPlaceholder="Search bookings..."
        />

        {/* Analytics Cards */}
        {analytics && (
          <div className="px-6 py-4 bg-background border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.total_bookings}</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics.total_revenue)}</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(analytics.average_booking_value)}</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancellations</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.cancellations}</p>
                  </div>
                  <div className="h-8 w-8 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* First Row - Status and Payment Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Payments</option>
                <option value="pending">Payment Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={refundFilter}
                onChange={(e) => setRefundFilter(e.target.value)}
                className="appearance-none bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Refunds</option>
                <option value="none">No Refund</option>
                <option value="requested">Refund Requested</option>
                <option value="processing">Processing</option>
                <option value="completed">Refund Completed</option>
                <option value="rejected">Refund Rejected</option>
              </select>
            </div>

            {/* Second Row - Entity Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter by property..."
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-0"
              />
              
              <input
                type="text"
                placeholder="Filter by user..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-0"
              />
            </div>

            {/* Third Row - Date Range and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedBookings.length} booking(s) selected:
              </span>
              <button
                onClick={() => handleBulkAction('confirm')}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                Confirm
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction('mark-paid')}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                Mark Paid
              </button>
              <button
                onClick={() => setSelectedBookings([])}
                className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/90"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Booking Table */}
        <main className="p-6">
          <div className="bg-card rounded-lg shadow-sm border">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedBookings.length === bookings.length && bookings.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-input text-primary focus:ring-ring"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/75"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Booking ID</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Guest Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Property
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/75"
                        onClick={() => handleSort('check_in_date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Check-in / Check-out</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/75"
                        onClick={() => handleSort('total_amount')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Amount</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-muted/25">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBookings.includes(booking.id)}
                            onChange={(e) => handleSelectBooking(booking.id, e.target.checked)}
                            className="rounded border-input text-primary focus:ring-ring"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          <div>
                            <div className="font-mono">{booking.id.slice(0, 8)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(booking.created_at)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{booking.user_name || 'Unknown User'}</div>
                              <div className="text-muted-foreground text-xs">{booking.guests} guests</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                              <Building className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {booking.property_title || 'Unknown Property'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Owner: {booking.owner_name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div>
                            <div className="flex items-center text-primary">
                              <CalendarCheck className="w-4 h-4 mr-1" />
                              {formatDate(booking.check_in_date)}
                            </div>
                            <div className="flex items-center text-muted-foreground mt-1">
                              <CalendarX className="w-4 h-4 mr-1" />
                              {formatDate(booking.check_out_date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <br />
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(booking.payment_status)}`}>
                              {booking.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <div>
                            <div className="font-semibold">{formatCurrency(booking.total_amount)}</div>
                            {booking.refund_amount > 0 && (
                              <div className="text-xs text-destructive">
                                Refund: {formatCurrency(booking.refund_amount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <IconButton
                              icon={Eye}
                              onClick={() => handleViewDetails(booking)}
                              variant="ghost"
                              size="sm"
                              tooltip="View Details"
                            />
                            <IconButton
                              icon={Check}
                              onClick={() => handleUpdateBooking(booking.id, 'status', 'confirmed')}
                              variant="success"
                              size="sm"
                              tooltip="Confirm Booking"
                              disabled={booking.status === 'confirmed'}
                            />
                            <IconButton
                              icon={X}
                              onClick={() => handleUpdateBooking(booking.id, 'status', 'cancelled')}
                              variant="danger"
                              size="sm"
                              tooltip="Cancel Booking"
                              disabled={booking.status === 'cancelled'}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none bg-background border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={bookings.length < rowsPerPage}
                  className="px-3 py-1 border border-input rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Booking Details Drawer */}
        {showDetailsDrawer && selectedBookingDetails && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailsDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card border-l shadow-xl">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-foreground">Booking Details</h3>
                  <IconButton
                    icon={X}
                    onClick={() => setShowDetailsDrawer(false)}
                    variant="ghost"
                    size="sm"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Booking Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Booking Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Booking ID:</span>
                        <div className="font-mono">{selectedBookingDetails.id}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <div>{formatDate(selectedBookingDetails.created_at)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-in:</span>
                        <div>{formatDate(selectedBookingDetails.check_in_date)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-out:</span>
                        <div>{formatDate(selectedBookingDetails.check_out_date)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Guests:</span>
                        <div>{selectedBookingDetails.guests}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Amount:</span>
                        <div className="font-semibold">{formatCurrency(selectedBookingDetails.total_amount)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status Updates */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Status Management</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Booking Status:</label>
                        <select
                          value={selectedBookingDetails.status}
                          onChange={(e) => handleUpdateBooking(selectedBookingDetails.id, 'status', e.target.value)}
                          className="w-full mt-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground">Payment Status:</label>
                        <select
                          value={selectedBookingDetails.payment_status}
                          onChange={(e) => handleUpdateBooking(selectedBookingDetails.id, 'payment_status', e.target.value)}
                          className="w-full mt-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground">Refund Status:</label>
                        <select
                          value={selectedBookingDetails.refund_status}
                          onChange={(e) => handleUpdateBooking(selectedBookingDetails.id, 'refund_status', e.target.value)}
                          className="w-full mt-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="none">No Refund</option>
                          <option value="requested">Requested</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm text-muted-foreground">Refund Amount:</label>
                        <input
                          type="number"
                          value={selectedBookingDetails.refund_amount}
                          onChange={(e) => handleUpdateBooking(selectedBookingDetails.id, 'refund_amount', Number(e.target.value))}
                          className="w-full mt-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          min="0"
                          max={selectedBookingDetails.total_amount}
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Guest Information</h4>
                    <div className="text-sm">
                      <div className="font-medium">{selectedBookingDetails.user_name || 'Unknown User'}</div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Property Information</h4>
                    <div className="text-sm">
                      <div className="font-medium">{selectedBookingDetails.property_title || 'Unknown Property'}</div>
                      <div className="text-muted-foreground">Owner: {selectedBookingDetails.owner_name || 'Unknown'}</div>
                      {selectedBookingDetails.agent_name && (
                        <div className="text-muted-foreground">Agent: {selectedBookingDetails.agent_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;