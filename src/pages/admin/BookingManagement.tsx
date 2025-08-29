import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { Badge } from "@/components/admin/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { Separator } from "@/components/admin/ui/separator";
import { Checkbox } from "@/components/admin/ui/checkbox";
import { Textarea } from "@/components/admin/ui/textarea";
import { CalendarDays, DollarSign, Users, TrendingUp, Search, Filter, Download, Check, X, Eye, Edit2, Trash2, ChevronUp, ChevronDown, RefreshCw, History, CreditCard, FileText, ArrowUpDown } from "lucide-react";
import { EnhancedBookingService, BookingFilters, BookingUpdateData } from "@/lib/enhancedBookingService";
import BookingModificationModal from "@/components/admin/BookingModificationModal";
import BookingHistoryModal from "@/components/admin/BookingHistoryModal";
import { useAnalyticsExport } from "@/hooks/useAnalyticsExport";

const BookingManagement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({
    status: undefined,
    payment_status: undefined,
    refund_status: undefined,
    search: undefined,
    start_date: undefined,
    end_date: undefined,
    property_id: undefined,
    owner_id: undefined,
    agent_id: undefined,
    user_id: undefined
  });
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queryClient = useQueryClient();
  const { exportToCsv, exporting } = useAnalyticsExport();

  // Fetch booking analytics
  const { data: analytics } = useQuery({
    queryKey: ['booking-analytics', filters.start_date, filters.end_date, filters.property_id, filters.owner_id, filters.agent_id],
    queryFn: async () => {
      return await EnhancedBookingService.getBookingAnalytics(
        filters.start_date,
        filters.end_date,
        filters.property_id,
        filters.owner_id,
        filters.agent_id
      );
    },
  });

  // Fetch bookings with pagination and filters
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['admin-bookings', currentPage, pageSize, sortBy, sortOrder, filters],
    queryFn: async () => {
      return await EnhancedBookingService.getBookings(
        currentPage,
        pageSize,
        filters,
        sortBy,
        sortOrder
      );
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, updateData, reason }: { bookingId: string; updateData: BookingUpdateData; reason: string }) => {
      return await EnhancedBookingService.updateBooking(bookingId, updateData, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-analytics'] });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ bookingIds, updateData, reason }: { bookingIds: string[]; updateData: BookingUpdateData; reason: string }) => {
      return await EnhancedBookingService.bulkUpdateBookings(bookingIds, updateData, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-analytics'] });
      setSelectedBookings([]);
      setShowBulkActionModal(false);
      setBulkAction('');
      setBulkReason('');
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(bookingsData?.data?.map(b => b.id) || []);
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleBulkAction = () => {
    if (selectedBookings.length === 0 || !bulkAction) return;
    setShowBulkActionModal(true);
  };

  const processBulkAction = async () => {
    if (!bulkReason.trim()) {
      alert('Please provide a reason for the bulk action');
      return;
    }

    const updateData: BookingUpdateData = {};
    
    switch (bulkAction) {
      case 'confirm':
        updateData.status = 'confirmed';
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        break;
      case 'mark-paid':
        updateData.payment_status = 'paid';
        break;
      case 'approve-refund':
        updateData.refund_status = 'approved';
        break;
      case 'process-refund':
        updateData.refund_status = 'processed';
        break;
      default:
        return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        bookingIds: selectedBookings,
        updateData,
        reason: bulkReason
      });
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('Bulk action failed. Please try again.');
    }
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsDrawer(true);
  };

  const handleModifyBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowModificationModal(true);
  };

  const handleViewHistory = (booking: any) => {
    setSelectedBooking(booking);
    setShowHistoryModal(true);
  };

  const handleUpdateBooking = async (bookingId: string, updateData: BookingUpdateData, reason: string) => {
    try {
      await updateBookingMutation.mutateAsync({
        bookingId,
        updateData,
        reason
      });
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await EnhancedBookingService.exportBookings(filters, 'csv');
      exportToCsv({
        data: [csvContent],
        filename: `bookings-export-${new Date().toISOString().split('T')[0]}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const updateFilters = (key: keyof BookingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === '' ? undefined : value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <SharedHeader title="Booking Management" />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Enhanced Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.total_bookings || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics?.total_revenue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics?.total_refunds || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analytics?.average_booking_value || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.cancellation_rate?.toFixed(1) || 0}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search bookings, guests, properties..."
                      value={filters.search || ''}
                      onChange={(e) => updateFilters('search', e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Booking Status</Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => updateFilters('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-filter">Payment Status</Label>
                  <Select value={filters.payment_status || 'all'} onValueChange={(value) => updateFilters('payment_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refund-filter">Refund Status</Label>
                  <Select value={filters.refund_status || 'all'} onValueChange={(value) => updateFilters('refund_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Refund Status</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => updateFilters('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => updateFilters('end_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Bookings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Bookings 
                  {bookingsData?.count && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({bookingsData.count} total)
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </Button>
                  {selectedBookings.length > 0 && (
                    <>
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Bulk Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirm">Confirm Bookings</SelectItem>
                          <SelectItem value="cancel">Cancel Bookings</SelectItem>
                          <SelectItem value="mark-paid">Mark as Paid</SelectItem>
                          <SelectItem value="approve-refund">Approve Refunds</SelectItem>
                          <SelectItem value="process-refund">Process Refunds</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                      >
                        Apply to {selectedBookings.length} selected
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow key="header">
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedBookings.length === bookingsData?.data?.length && bookingsData?.data?.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortBy === 'created_at' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('property_title')}
                    >
                      <div className="flex items-center gap-1">
                        Property
                        {sortBy === 'property_title' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Guest Details</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('total_amount')}
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {sortBy === 'total_amount' && (
                          <ArrowUpDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        Loading bookings...
                      </TableCell>
                    </TableRow>
                  ) : bookingsData?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookingsData?.data?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedBookings.includes(booking.id)}
                            onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(booking.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.property_title}</div>
                          {booking.owner_name && (
                            <div className="text-sm text-muted-foreground">Owner: {booking.owner_name}</div>
                          )}
                          {booking.agent_name && (
                            <div className="text-sm text-muted-foreground">Agent: {booking.agent_name}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.user_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.user_email}</div>
                          {booking.user_phone && (
                            <div className="text-sm text-muted-foreground">{booking.user_phone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                          </div>
                        </TableCell>
                        <TableCell>{booking.guests}</TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(booking.total_amount)}</div>
                          {booking.refund_amount > 0 && (
                            <div className="text-sm text-red-600">
                              Refund: {formatCurrency(booking.refund_amount)}
                            </div>
                          )}
                          {booking.payment_mode && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {booking.payment_mode}
                            </div>
                          )}
                          {booking.transaction_id && (
                            <div className="text-xs text-muted-foreground">
                              TXN: {booking.transaction_id.slice(-8)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          {booking.cancellation_reason && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-32 truncate" title={booking.cancellation_reason}>
                              {booking.cancellation_reason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.refund_status === 'none' ? 'outline' : 'secondary'}>
                            {booking.refund_status}
                          </Badge>
                          {booking.refund_amount > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(booking.refund_amount)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModifyBooking(booking)}
                              title="Modify Booking"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(booking)}
                              title="View History"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Enhanced Pagination */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, bookingsData?.count || 0)} of {bookingsData?.count || 0} bookings
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {bookingsData?.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === (bookingsData?.totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Enhanced Booking Details Drawer */}
      {showDetailsDrawer && selectedBooking && (
        <Dialog open={showDetailsDrawer} onOpenChange={setShowDetailsDrawer}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Booking Details - {selectedBooking.property_title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Property Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Property Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Property Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.property_title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Owner</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.owner_name || 'N/A'}</p>
                  </div>
                  {selectedBooking.agent_name && (
                    <div>
                      <Label className="text-sm font-medium">Agent</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.agent_name}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Guest Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Guest Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Guest Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Number of Guests</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.guests}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Booking Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Check-in Date</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Check-out Date</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Amount</Label>
                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedBooking.total_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Booking Date</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedBooking.created_at)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Payment Mode</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.payment_mode || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transaction ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Refund Amount</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.refund_amount ? formatCurrency(selectedBooking.refund_amount) : 'N/A'}
                    </p>
                  </div>
                  {selectedBooking.refund_requested_at && (
                    <div>
                      <Label className="text-sm font-medium">Refund Requested</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedBooking.refund_requested_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Status Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Booking Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Status</Label>
                    <div className="mt-1">
                      <Badge variant={getPaymentStatusColor(selectedBooking.payment_status)}>
                        {selectedBooking.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Refund Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedBooking.refund_status === 'none' ? 'outline' : 'secondary'}>
                        {selectedBooking.refund_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedBooking.cancellation_reason && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Cancellation Reason</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.cancellation_reason}</p>
                  </div>
                )}
                {selectedBooking.modification_reason && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Last Modification Reason</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.modification_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => handleModifyBooking(selectedBooking)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modify Booking
                </Button>
                <Button variant="outline" onClick={() => handleViewHistory(selectedBooking)}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Booking Modification Modal */}
      {showModificationModal && selectedBooking && (
        <BookingModificationModal
          open={showModificationModal}
          onOpenChange={setShowModificationModal}
          booking={selectedBooking}
          onUpdate={handleUpdateBooking}
        />
      )}

      {/* Booking History Modal */}
      {showHistoryModal && selectedBooking && (
        <BookingHistoryModal
          open={showHistoryModal}
          onOpenChange={setShowHistoryModal}
          bookingId={selectedBooking.id}
          propertyTitle={selectedBooking.property_title}
        />
      )}

      {/* Bulk Action Modal */}
      {showBulkActionModal && (
        <Dialog open={showBulkActionModal} onOpenChange={setShowBulkActionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Action: {bulkAction.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to apply this action to {selectedBookings.length} selected bookings.
              </p>
              <div className="space-y-2">
                <Label htmlFor="bulk-reason">Reason for this action *</Label>
                <Textarea
                  id="bulk-reason"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Please provide a reason for this bulk action..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowBulkActionModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={processBulkAction} 
                  disabled={!bulkReason.trim() || bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? 'Processing...' : 'Apply Action'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BookingManagement;