import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Check,
  Eye,
  Trash2,
  X,
  ArrowUpDown,
  List,
  CreditCard,
  Clock,
  Percent,
  History,
  Download,
  Receipt,
  RotateCcw,
  RefreshCw,
  University,
  Smartphone,
  ChevronDown,
  Search,
  Home,
  Edit,
  AlertTriangle,
  FileText,
  Info,
  UserX,
  Database
} from 'lucide-react';
import SharedSidebar from '../../components/admin/SharedSidebar';
import SharedHeader from '../../components/admin/SharedHeader';
import { commissionService, CommissionData } from '../../lib/commissionService';
import { useAnalyticsExport } from '../../hooks/useAnalyticsExport';
import ProcessPaymentModal from '../../components/admin/commission/ProcessPaymentModal';
import ApproveRejectModal from '../../components/admin/commission/ApproveRejectModal';
import EditCommissionModal from '../../components/admin/commission/EditCommissionModal';
import RevenueSplitSummary from '../../components/admin/commission/RevenueSplitSummary';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CommissionDisbursement: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Modal states
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showApproveRejectModal, setShowApproveRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [approveRejectAction, setApproveRejectAction] = useState<'approve' | 'reject'>('approve');
  const [selectedCommission, setSelectedCommission] = useState<CommissionData | null>(null);

  // Data states
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revenueSummary, setRevenueSummary] = useState({
    totalAdmin: 0,
    totalOwner: 0,
    totalAgent: 0,
    totalAmount: 0
  });

  // Diagnostic states
  const [userRole, setUserRole] = useState<string | null>(null);

  const { exportToCsv, exportToPdf, exporting } = useAnalyticsExport();
  const { toast } = useToast();

  // Derived state for button controls
  const selectedSingle = selectedCommissions.length === 1 ? commissions.find(c => c.id === selectedCommissions[0]) : null;
  const canProcessSelected = selectedSingle && ['approved', 'processing'].includes(selectedSingle.disbursement_status);

  // Load commissions
  const loadCommissions = async () => {
    setLoading(true);
    try {
      const { data, count } = await commissionService.getCommissions({
        search: searchTerm,
        status: statusFilter,
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage,
        sortBy,
        sortDir
      });
      setCommissions(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load revenue summary
  const loadRevenueSummary = async () => {
    try {
      const summary = await commissionService.getRevenueSplitSummary({
        status: statusFilter,
        dateFrom,
        dateTo
      });
      setRevenueSummary(summary);
    } catch (error) {
      console.error('Error loading revenue summary:', error);
    }
  };

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('📊 Commission page - Current user:', user?.email);
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          console.log('📊 Commission page - User role:', profile?.role);
          setUserRole(profile?.role || 'unknown');
          
          if (profile?.role !== 'admin') {
            toast({
              title: "Access Notice",
              description: `You're logged in as '${profile?.role}'. Admin access needed for commission management.`,
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, []);

  useEffect(() => {
    loadCommissions();
  }, [searchTerm, statusFilter, currentPage, rowsPerPage, sortBy, sortDir]);

  useEffect(() => {
    loadRevenueSummary();
  }, [statusFilter, dateFrom, dateTo]);

  // Real-time updates for commission changes
  useEffect(() => {
    const channel = supabase
      .channel('commission-disbursements-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'commission_disbursements'
      }, (payload) => {
        console.log('💰 Commission disbursement updated:', payload);
        loadCommissions();
        loadRevenueSummary();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const failedCommissions = commissions.filter(c => c.disbursement_status === 'failed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCommissions(commissions.map(item => item.id));
    } else {
      setSelectedCommissions([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedCommissions([...selectedCommissions, itemId]);
    } else {
      setSelectedCommissions(selectedCommissions.filter(id => id !== itemId));
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Action handlers
  const handleProcessPayment = async (paymentMode: string, paymentReference: string, paymentDate: string) => {
    if (!selectedCommission) return;
    
    try {
      await commissionService.processPayment(selectedCommission.id, paymentMode, paymentReference, paymentDate);
      await loadCommissions();
      await loadRevenueSummary();
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  const handleApprove = async (commissionId: string, notes?: string) => {
    try {
      await commissionService.approveCommission(commissionId, notes);
      await loadCommissions();
      await loadRevenueSummary();
    } catch (error) {
      console.error('Error approving commission:', error);
      throw error;
    }
  };

  const handleReject = async (commissionId: string, reason: string) => {
    try {
      await commissionService.rejectCommission(commissionId, reason);
      await loadCommissions();
      await loadRevenueSummary();
    } catch (error) {
      console.error('Error rejecting commission:', error);
      throw error;
    }
  };

  const handleEdit = async (commissionId: string, updates: Partial<CommissionData>) => {
    try {
      await commissionService.updateCommission(commissionId, updates);
      await loadCommissions();
      await loadRevenueSummary();
    } catch (error) {
      console.error('Error updating commission:', error);
      throw error;
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCommissions.length === 0) return;

    try {
      switch (action) {
        case 'approve':
          await commissionService.bulkUpdateStatus(selectedCommissions, 'approved');
          break;
        case 'reject':
          const reason = prompt('Enter rejection reason:');
          if (!reason) return;
          await commissionService.bulkUpdateStatus(selectedCommissions, 'rejected', reason);
          break;
        case 'process':
          await commissionService.bulkUpdateStatus(selectedCommissions, 'processing');
          break;
        case 'export':
          const selectedData = commissions.filter(c => selectedCommissions.includes(c.id));
          exportToCsv({
            data: selectedData,
            filename: 'selected-commissions',
            headers: ['id', 'property_title', 'booking_id', 'owner_name', 'agent_name', 'total_booking_amount', 'admin_commission', 'owner_share', 'agent_commission', 'disbursement_status']
          });
          break;
      }
      
      if (action !== 'export') {
        await loadCommissions();
        await loadRevenueSummary();
      }
      
      setSelectedCommissions([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error(`Error executing bulk ${action}:`, error);
    }
  };

  const handleExportAll = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        exportToCsv({
          data: commissions,
          filename: 'commission-disbursements',
          headers: ['id', 'property_title', 'booking_id', 'owner_name', 'agent_name', 'total_booking_amount', 'admin_commission', 'owner_share', 'agent_commission', 'disbursement_status']
        });
      } else {
        exportToPdf({
          data: commissions,
          filename: 'commission-disbursements'
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Generate sample commission data for testing
  const generateSampleCommissions = async () => {
    try {
      console.log('📊 Generating sample commission data...');
      
      // First, fetch real bookings to use their valid IDs
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          property_id,
          user_id,
          agent_id,
          total_amount,
          properties!inner(
            owner_id,
            title
          )
        `)
        .limit(3);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        toast({
          title: "Error",
          description: "No bookings found to generate commission data.",
          variant: "destructive",
        });
        return;
      }

      if (!bookings || bookings.length === 0) {
        toast({
          title: "Info",
          description: "No bookings available. Create some bookings first.",
        });
        return;
      }

      // Generate commission data based on real bookings
      const sampleData = bookings.map((booking, index) => {
        const adminRate = 0.10; // 10% admin commission
        const agentRate = booking.agent_id ? 0.05 : 0; // 5% agent commission if agent exists
        
        const adminCommission = booking.total_amount * adminRate;
        const agentCommission = booking.total_amount * agentRate;
        const ownerShare = booking.total_amount - adminCommission - agentCommission;
        
        const statuses = ['pending', 'approved', 'pending'];
        const dueDates = [
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days from now
        ];

        return {
          booking_id: booking.id,
          property_id: booking.property_id,
          owner_id: booking.properties.owner_id,
          agent_id: booking.agent_id,
          total_booking_amount: booking.total_amount,
          admin_commission: Math.round(adminCommission * 100) / 100,
          owner_share: Math.round(ownerShare * 100) / 100,
          agent_commission: Math.round(agentCommission * 100) / 100,
          disbursement_status: statuses[index % statuses.length],
          due_date: dueDates[index % dueDates.length]
        };
      });

      // Check if commission records already exist for these bookings
      const { data: existingCommissions } = await supabase
        .from('commission_disbursements')
        .select('booking_id')
        .in('booking_id', sampleData.map(d => d.booking_id));

      const existingBookingIds = new Set(existingCommissions?.map(c => c.booking_id) || []);
      const newSampleData = sampleData.filter(d => !existingBookingIds.has(d.booking_id));

      if (newSampleData.length === 0) {
        toast({
          title: "Info",
          description: "Commission data already exists for these bookings.",
        });
        return;
      }

      const { error } = await supabase
        .from('commission_disbursements')
        .insert(newSampleData);

      if (error) {
        console.error('Error inserting sample data:', error);
        toast({
          title: "Error",
          description: `Failed to generate sample data: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Generated ${newSampleData.length} commission records successfully!`,
      });
      
      await loadCommissions();
      await loadRevenueSummary();
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to generate sample data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <SharedSidebar 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed} 
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <SharedHeader 
          title="Commission & Disbursement" 
          breadcrumb="Commission & Disbursement"
          searchPlaceholder="Search commissions..."
        />

        {/* Failed Payments Alert */}
        {failedCommissions.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>{failedCommissions.length} failed payment{failedCommissions.length > 1 ? 's' : ''}</strong> need admin attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Split Summary */}
        <div className="px-6 pt-6">
          <RevenueSplitSummary summary={revenueSummary} />
        </div>

        {/* Action Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <button
                  onClick={() => {
                    if (selectedSingle) {
                      setSelectedCommission(selectedSingle);
                      setShowProcessModal(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    canProcessSelected 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!canProcessSelected}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Process Payments
                </button>
                {!canProcessSelected && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-black text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {selectedCommissions.length === 0 ? 
                      "Select one commission to process payment" :
                      selectedCommissions.length > 1 ?
                      "Select only one commission at a time" :
                      selectedSingle?.disbursement_status === 'pending' ?
                      "Commission must be approved first" :
                      "Commission status doesn't allow payment processing"
                    }
                  </div>
                )}
              </div>
              
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {selectedCommissions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex items-center"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedCommissions.length})
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <button
                        onClick={() => handleBulkAction('approve')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-green-600 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('reject')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-red-600 flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('process')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 flex items-center"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Mark as Processing
                      </button>
                      <button
                        onClick={() => handleBulkAction('export')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer text-blue-600 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportAll('csv')}
                  className="text-gray-600 hover:text-gray-800 cursor-pointer p-2 border border-gray-300 rounded-lg flex items-center"
                  title="Export to CSV"
                  disabled={exporting}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => handleExportAll('pdf')}
                  className="text-gray-600 hover:text-gray-800 cursor-pointer p-2 border border-gray-300 rounded-lg flex items-center"
                  title="Export to PDF"
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search commissions..."
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedCommissions.length === commissions.length && commissions.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center">
                        Commission ID
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stay Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('total_booking_amount')}
                    >
                      <div className="flex items-center">
                        Total Amount
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Share</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Commission</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('due_date')}
                    >
                      <div className="flex items-center">
                        Due Date
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('disbursement_status')}
                    >
                      <div className="flex items-center">
                        Status
                        <ArrowUpDown className="w-3 h-3 ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-8 text-center text-gray-500">
                        Loading commissions...
                      </td>
                    </tr>
                  ) : commissions.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-12">
                        <div className="text-center">
                          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Commission Data Found</h3>
                          <div className="text-gray-500 space-y-2 mb-6">
                            <p>This could be due to:</p>
                            <ul className="text-sm space-y-1">
                              <li>• No commission data has been generated yet</li>
                              <li>• User role restrictions (Current role: <span className="font-medium">{userRole || 'unknown'}</span>)</li>
                              <li>• Database access permissions</li>
                              <li>• Applied filters removing all results</li>
                            </ul>
                          </div>
                          
                          {userRole === 'admin' ? (
                            <div className="space-y-3">
                              <button
                                onClick={generateSampleCommissions}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center mx-auto"
                              >
                                <Database className="w-4 h-4 mr-2" />
                                Generate Sample Data
                              </button>
                              <p className="text-xs text-gray-400">
                                This will create 3 sample commission records for testing
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                              <div className="flex items-center">
                                <UserX className="w-5 h-5 text-yellow-600 mr-2" />
                                <div className="text-sm">
                                  <p className="font-medium text-yellow-800">Admin Access Required</p>
                                  <p className="text-yellow-700">You need admin permissions to manage commissions</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={(e) => handleSelectItem(commission.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commission.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{commission.property_title}</div>
                              <div className="text-sm text-gray-500">Booking: {commission.booking_id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{formatDate(commission.check_in_date)}</div>
                            <div className="text-gray-500">to {formatDate(commission.check_out_date)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{commission.owner_name}</div>
                            <div className="text-gray-500">{commission.owner_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.agent_name ? (
                            <div>
                              <div className="font-medium">{commission.agent_name}</div>
                              <div className="text-gray-500">{commission.agent_email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(commission.total_booking_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {formatCurrency(commission.admin_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(commission.owner_share)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                          {formatCurrency(commission.agent_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className={commission.disbursement_status === 'failed' || 
                            (commission.due_date && new Date(commission.due_date) < new Date()) ? 'text-red-600' : ''}>
                            {formatDate(commission.due_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.disbursement_status)}`}>
                            {commission.disbursement_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.payment_mode ? (
                            <div>
                              <div className="font-medium">{commission.payment_mode}</div>
                              {commission.payment_reference && (
                                <div className="text-gray-500 text-xs">{commission.payment_reference}</div>
                              )}
                              {commission.payment_date && (
                                <div className="text-gray-500 text-xs">{formatDate(commission.payment_date)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {commission.disbursement_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedCommission(commission);
                                    setApproveRejectAction('approve');
                                    setShowApproveRejectModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800 cursor-pointer p-1"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCommission(commission);
                                    setApproveRejectAction('reject');
                                    setShowApproveRejectModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 cursor-pointer p-1"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(commission.disbursement_status === 'approved' || commission.disbursement_status === 'processing') && (
                              <button
                                onClick={() => {
                                  setSelectedCommission(commission);
                                  setShowProcessModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer p-1"
                                title="Process Payment"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedCommission(commission);
                                setShowEditModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-800 cursor-pointer p-1"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} entries
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
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
                    );
                  })}
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

      {/* Modals */}
      <ProcessPaymentModal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          setSelectedCommission(null);
        }}
        commission={selectedCommission}
        onProcess={handleProcessPayment}
      />

      <ApproveRejectModal
        isOpen={showApproveRejectModal}
        onClose={() => {
          setShowApproveRejectModal(false);
          setSelectedCommission(null);
        }}
        commission={selectedCommission}
        action={approveRejectAction}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <EditCommissionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCommission(null);
        }}
        commission={selectedCommission}
        onUpdate={handleEdit}
      />
    </div>
  );
};

export default CommissionDisbursement;
