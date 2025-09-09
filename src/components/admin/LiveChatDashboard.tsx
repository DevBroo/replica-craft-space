import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SharedSidebar from './SharedSidebar';
import SharedHeader from './SharedHeader';
import AdminAccessTest from './AdminAccessTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supportTicketService, DatabaseTicket } from '@/lib/supportTicketService';
import { AIChatService, CustomerDetails } from '@/lib/aiChatService';
import { supabase } from '@/integrations/supabase/client';
import {
    MessageCircle,
    Bot,
    User,
    Clock,
    AlertCircle,
    CheckCircle,
    Phone,
    Mail,
    MapPin,
    Search,
    Filter,
    Eye,
    MessageSquare,
    Home
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ChatSession extends DatabaseTicket {
    customer_details?: CustomerDetails;
    message_count?: number;
    last_message_at?: string;
    is_ai_handled?: boolean;
}

export const LiveChatDashboard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    // Load chat sessions
    useEffect(() => {
        loadChatSessions();

        // Set up real-time subscription for new messages
        const channel = supabase
            .channel('live-chat-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'support_ticket_messages'
            }, (payload) => {
                const newMessage = payload.new;

                // Show notification for new message (only for customer/property owner messages)
                if (newMessage.author_role === 'customer' || newMessage.author_role === 'property_owner') {
                    toast({
                        title: "New Customer Message",
                        description: `A ${newMessage.author_role} has sent a new message in live chat.`,
                        variant: "default",
                    });
                }

                // Reload sessions to update recent messages
                loadChatSessions();
            })
            .subscribe();

        // Refresh every 30 seconds as backup
        const interval = setInterval(loadChatSessions, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [statusFilter, priorityFilter, searchTerm]);

    const loadChatSessions = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading chat sessions for admin...');

            // First, let's try to get all tickets to see what we have
            const allTickets = await supportTicketService.getTickets({
                limit: 50
            });
            console.log('📊 All tickets data:', allTickets);
            console.log('📊 All tickets count:', allTickets?.length || 0);

            const data = await supportTicketService.getTickets({
                limit: 50,
                category: 'live_chat'
            });

            console.log('📊 Live chat tickets data:', data);
            console.log('📊 Live chat tickets count:', data?.length || 0);
            console.log('🔍 Filtering by category: live_chat');

            // If no live chat tickets, let's try without category filter
            if (!data || data.length === 0) {
                console.log('⚠️ No live chat tickets found, trying without category filter...');
                const fallbackData = await supportTicketService.getTickets({
                    limit: 50
                });
                console.log('📊 Fallback tickets data:', fallbackData);

                // Filter manually for live chat tickets
                const manualFiltered = fallbackData?.filter(ticket =>
                    ticket.category === 'live_chat' ||
                    ticket.subject?.toLowerCase().includes('live chat') ||
                    ticket.subject?.toLowerCase().includes('chat session')
                ) || [];
                console.log('📊 Manually filtered live chat tickets:', manualFiltered);

                if (manualFiltered.length > 0) {
                    console.log('✅ Found live chat tickets via manual filtering, using these...');
                    setChatSessions(manualFiltered.map(ticket => ({
                        ...ticket,
                        customer_details: {},
                        message_count: 0,
                        last_message_at: ticket.updated_at,
                        is_ai_handled: false
                    })));
                    return;
                }
            }

            if (!data) {
                console.log('⚠️ No data returned from getTickets');
                setChatSessions([]);
                return;
            }

            // Process each session to extract customer details
            const processedSessions = (data || []).map(ticket => {
                let customerDetails: CustomerDetails = {};

                // Try to parse customer details from description
                if (ticket.description) {
                    try {
                        const parsed = JSON.parse(ticket.description);
                        customerDetails = {
                            name: parsed.customer_details?.name || 'Unknown Customer',
                            email: parsed.customer_details?.email || ticket.customer_email || 'No email',
                            phone: parsed.customer_details?.phone || ticket.customer_phone || '',
                            issue_type: parsed.customer_details?.issue_type || 'General',
                            ...parsed.customer_details
                        };
                    } catch (e) {
                        console.warn('Failed to parse customer details:', e);
                        customerDetails = {
                            name: 'Unknown Customer',
                            email: ticket.customer_email || 'No email',
                            phone: ticket.customer_phone || '',
                            issue_type: 'General'
                        };
                    }
                }

                // Extract customer name from subject if not in description
                if (!customerDetails.name || customerDetails.name === 'Unknown Customer') {
                    const subjectMatch = ticket.subject?.match(/Live Chat Session - (.+)/);
                    if (subjectMatch) {
                        customerDetails.name = subjectMatch[1];
                    }
                }

                return {
                    ...ticket,
                    customer_details: customerDetails,
                    message_count: 0, // We can add this later if needed
                    last_message_at: ticket.updated_at,
                    is_ai_handled: false // We can determine this from messages if needed
                };
            });

            console.log('✅ Processed sessions:', processedSessions);
            console.log('📊 Session count:', processedSessions.length);
            setChatSessions(processedSessions);

            // Auto-select ticket if coming from support tickets
            const ticketId = searchParams.get('ticketId');
            if (ticketId) {
                const targetSession = processedSessions.find(session => session.id === ticketId);
                if (targetSession) {
                    console.log('🎯 Auto-selecting ticket:', ticketId);
                    setSelectedSession(targetSession);
                    loadSessionMessages(targetSession.id);
                }
            }

        } catch (error: any) {
            console.error('❌ Error loading chat sessions:', error);

            // Check if it's a permission error
            if (error?.message?.includes('permission') || error?.message?.includes('access') || error?.message?.includes('403') || error?.message?.includes('401')) {
                toast({
                    title: "Access Denied",
                    description: "You don't have permission to access live chat sessions. Please contact your administrator.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Error",
                    description: `Failed to load chat sessions: ${error?.message || 'Unknown error'}`,
                    variant: "destructive"
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSessionMessages = async (sessionId: string) => {
        try {
            const data = await supportTicketService.getTicketMessages(sessionId);
            console.log('📨 Session messages:', data);

            // Format messages for display
            const formattedMessages = (data || []).map(msg => ({
                ...msg,
                author_name: msg.author_role === 'ai_assistant' ? 'AI Assistant' :
                    msg.author_profile?.full_name || 'Unknown'
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error loading session messages:', error);
            toast({
                title: "Error",
                description: "Failed to load session messages",
                variant: "destructive"
            });
        }
    };

    const takeSession = async (sessionId: string) => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Error",
                    description: "You must be logged in to take a session",
                    variant: "destructive"
                });
                return;
            }

            // Update ticket: assign to current admin and set status to in-progress
            await supportTicketService.updateTicket(sessionId, {
                assigned_agent: user.id,
                status: 'in-progress'
            });

            // Add a system message
            await supportTicketService.addMessage(
                sessionId,
                `Session taken by admin. A support representative is now handling your chat.`,
                false,
                'system'
            );

            toast({
                title: "Session Taken",
                description: "You are now handling this live chat session. Redirecting to Support Tickets...",
            });

            // Navigate to support tickets
            window.location.href = '/admin/support-tickets';

            // Reload sessions
            loadChatSessions();
        } catch (error) {
            console.error('Error taking session:', error);
            toast({
                title: "Error",
                description: "Failed to take session",
                variant: "destructive"
            });
        }
    };

    const updateSessionStatus = async (sessionId: string, status: string) => {
        try {
            await supportTicketService.updateStatus(sessionId, status, `Status updated to ${status} by admin`);

            toast({
                title: "Success",
                description: `Session status updated to ${status}`,
            });

            loadChatSessions();
        } catch (error) {
            console.error('Error updating session status:', error);
            toast({
                title: "Error",
                description: "Failed to update session status",
                variant: "destructive"
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Categorize sessions by user role (with safety checks)
    const customerSessions = (chatSessions || []).filter(session => {
        if (!session) return false;
        const userRole = getUserRoleFromSession(session);
        console.log('👤 Session role check:', { sessionId: session.id, userRole, isCustomer: userRole === 'customer' });
        // Show as customer if role is customer or unknown (fallback)
        return userRole === 'customer' || userRole === 'unknown';
    });

    const propertyOwnerSessions = (chatSessions || []).filter(session => {
        if (!session) return false;
        const userRole = getUserRoleFromSession(session);
        console.log('🏠 Session role check:', { sessionId: session.id, userRole, isPropertyOwner: userRole === 'property_owner' });
        return userRole === 'property_owner';
    });

    console.log('📊 Categorized sessions:', {
        total: chatSessions.length,
        customers: customerSessions.length,
        propertyOwners: propertyOwnerSessions.length
    });

    // Helper function to get user role from session
    function getUserRoleFromSession(session: ChatSession): 'customer' | 'property_owner' | 'unknown' {
        if (!session) return 'unknown';

        try {
            if (session.description) {
                const parsed = JSON.parse(session.description);
                console.log('🔍 Parsed description for role:', parsed);
                const userRole = parsed.user_role || 'unknown';
                console.log('🎭 User role from description:', userRole);
                return userRole;
            }
        } catch (e) {
            // Fallback - could check customer_details or other indicators
            console.warn('Error parsing session description:', e);
        }

        // If no role found in description, default to customer for now
        console.log('⚠️ No role found in description, defaulting to customer');
        return 'customer';
    }

    const filteredCustomerSessions = (customerSessions || []).filter(session => {
        if (!session) return false;
        const matchesSearch = !searchTerm ||
            session.customer_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer_details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.subject?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredPropertyOwnerSessions = (propertyOwnerSessions || []).filter(session => {
        if (!session) return false;
        const matchesSearch = !searchTerm ||
            session.customer_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.customer_details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.subject?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Early return for loading state
    if (loading && chatSessions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading live chat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <SharedSidebar
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <SharedHeader
                    title="Live Chat Dashboard"
                    breadcrumb="Live Chat"
                    searchPlaceholder="Search sessions..."
                />

                <main className="p-6 space-y-6">
                    {/* Header with Stats */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Live Chat Dashboard</h1>
                            <p className="text-muted-foreground">Manage customer support chat sessions</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {filteredCustomerSessions.length + filteredPropertyOwnerSessions.length} Total Sessions
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                {[...filteredCustomerSessions, ...filteredPropertyOwnerSessions].filter(s => s.is_ai_handled).length} AI Handled
                            </Badge>
                            <Badge variant="default" className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {[...filteredCustomerSessions, ...filteredPropertyOwnerSessions].filter(s => s.status === 'open').length} Open
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {[...filteredCustomerSessions, ...filteredPropertyOwnerSessions].filter(s => s.status === 'closed').length} Closed
                            </Badge>
                        </div>
                    </div>

                    {/* Debug Component - Remove this after fixing the issue */}
                    {(filteredCustomerSessions.length + filteredPropertyOwnerSessions.length) === 0 && !loading && (
                        <div className="space-y-4">
                            <AdminAccessTest />
                            <Card>
                                <CardHeader>
                                    <CardTitle>Debug: Load All Tickets</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        onClick={async () => {
                                            console.log('🔧 Debug: Loading all tickets...');
                                            const allTickets = await supportTicketService.getTickets({ limit: 50 });
                                            console.log('🔧 Debug: All tickets:', allTickets);
                                            setChatSessions(allTickets?.map(ticket => ({
                                                ...ticket,
                                                customer_details: {},
                                                message_count: 0,
                                                last_message_at: ticket.updated_at,
                                                is_ai_handled: false
                                            })) || []);
                                        }}
                                        variant="outline"
                                    >
                                        Load All Tickets (Debug)
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by customer name, email, or subject..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={loadChatSessions} variant="outline">
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sessions List */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Customer Chats Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Customer Support Chats
                                    </CardTitle>
                                    <CardDescription>
                                        {loading ? 'Loading customer sessions...' : `${filteredCustomerSessions.length} customer sessions found`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {filteredCustomerSessions.length === 0 ? (
                                            <div className="text-center py-8">
                                                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No customer sessions</h3>
                                                <p className="text-gray-500">Customer chat sessions will appear here.</p>
                                            </div>
                                        ) : (
                                            filteredCustomerSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedSession?.id === session.id ? 'bg-primary/10 border-primary' : ''
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedSession(session);
                                                        loadSessionMessages(session.id);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold text-sm">{session.subject || 'Customer Chat'}</h3>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Customer
                                                                </Badge>
                                                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                                                                    {session.status}
                                                                </span>
                                                                {session.priority && (
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(session.priority)}`}>
                                                                        {session.priority}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                <p className="font-medium">
                                                                    {session.customer_details?.name || 'Customer'}
                                                                </p>
                                                                {session.customer_details?.email && (
                                                                    <p>{session.customer_details.email}</p>
                                                                )}
                                                                <p>Started: {format(new Date(session.created_at), 'MMM dd, HH:mm')}</p>
                                                            </div>

                                                            {session.customer_details?.issue_type && (
                                                                <div className="flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Issue: {session.customer_details.issue_type}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="flex gap-2">
                                                                {session.status === 'open' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            takeSession(session.id);
                                                                        }}
                                                                    >
                                                                        Take Session
                                                                    </Button>
                                                                )}
                                                                {session.status !== 'closed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSessionStatus(session.id, 'closed');
                                                                        }}
                                                                    >
                                                                        Close
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <Button size="sm" variant="ghost">
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Property Owner Chats Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Home className="w-5 h-5 text-green-600" />
                                        Property Owner Support Chats
                                    </CardTitle>
                                    <CardDescription>
                                        {loading ? 'Loading property owner sessions...' : `${filteredPropertyOwnerSessions.length} property owner sessions found`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {filteredPropertyOwnerSessions.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No property owner sessions</h3>
                                                <p className="text-gray-500">Property owner chat sessions will appear here.</p>
                                            </div>
                                        ) : (
                                            filteredPropertyOwnerSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedSession?.id === session.id ? 'bg-primary/10 border-primary' : ''
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedSession(session);
                                                        loadSessionMessages(session.id);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold text-sm">{session.subject || 'Property Owner Chat'}</h3>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Property Owner
                                                                </Badge>
                                                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
                                                                    {session.status}
                                                                </span>
                                                                {session.priority && (
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(session.priority)}`}>
                                                                        {session.priority}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                <p className="font-medium">
                                                                    {session.customer_details?.name || 'Property Owner'}
                                                                </p>
                                                                {session.customer_details?.email && (
                                                                    <p>{session.customer_details.email}</p>
                                                                )}
                                                                <p>Started: {format(new Date(session.created_at), 'MMM dd, HH:mm')}</p>
                                                            </div>

                                                            {session.customer_details?.issue_type && (
                                                                <div className="flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Issue: {session.customer_details.issue_type}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between mt-3">
                                                            <div className="flex gap-2">
                                                                {session.status === 'open' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            takeSession(session.id);
                                                                        }}
                                                                    >
                                                                        Take Session
                                                                    </Button>
                                                                )}
                                                                {session.status !== 'closed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateSessionStatus(session.id, 'closed');
                                                                        }}
                                                                    >
                                                                        Close
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <Button size="sm" variant="ghost">
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Session Details */}
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5" />
                                        Session Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedSession ? (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold mb-2">{selectedSession.subject}</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{selectedSession.customer_details?.name || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{selectedSession.customer_details?.email || 'No email'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{format(new Date(selectedSession.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h4 className="font-semibold mb-2">Recent Messages</h4>
                                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                                    {messages.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">No messages yet</p>
                                                    ) : (
                                                        messages.slice(-5).map((message) => (
                                                            <div key={message.id} className="p-2 bg-muted rounded text-sm">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium">
                                                                        {message.author_role === 'ai_assistant' ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <Bot className="w-3 h-3" />
                                                                                AI Assistant
                                                                            </span>
                                                                        ) : (
                                                                            message.author_name
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {format(new Date(message.created_at), 'HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <p>{message.content}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No session selected</h3>
                                            <p className="text-gray-500">Select a session to view details and messages</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LiveChatDashboard;
