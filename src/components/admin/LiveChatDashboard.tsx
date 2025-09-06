import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supportTicketService, DatabaseTicket } from '@/lib/supportTicketService';
import { AIChatService, CustomerDetails } from '@/lib/aiChatService';
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
  MessageSquare
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
    
    // Refresh every 30 seconds
    const interval = setInterval(loadChatSessions, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, priorityFilter, searchTerm]);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit: 50,
        offset: 0
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchTerm) params.search = searchTerm;

      const tickets = await supportTicketService.getTickets(params);
      
      // Filter for live chat tickets and enhance with customer details
      const chatTickets = tickets
        .filter(ticket => ticket.subject.includes('Live Chat'))
        .map(ticket => {
          let customerDetails: CustomerDetails = {};
          let isAIHandled = false;
          
          try {
            if (ticket.description) {
              const parsed = JSON.parse(ticket.description);
              customerDetails = parsed.customer_details || {};
              isAIHandled = parsed.conversation_summary?.some((msg: any) => 
                msg.role === 'assistant'
              ) || false;
            }
          } catch (e) {
            // Ignore parsing errors
          }

          return {
            ...ticket,
            customer_details: customerDetails,
            is_ai_handled: isAIHandled
          };
        });

      setChatSessions(chatTickets);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const sessionMessages = await supportTicketService.getTicketMessages(sessionId);
      setMessages(sessionMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      toast({
        title: "Error",
        description: "Failed to load session messages",
        variant: "destructive"
      });
    }
  };

  const assignToAgent = async (sessionId: string, agentId: string) => {
    try {
      await supportTicketService.updateTicket(sessionId, {
        assigned_agent: agentId,
        status: 'in-progress'
      });
      
      toast({
        title: "Success",
        description: "Session assigned to agent",
      });
      
      loadChatSessions();
    } catch (error) {
      console.error('Error assigning session:', error);
      toast({
        title: "Error",
        description: "Failed to assign session",
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

  const filteredSessions = chatSessions.filter(session => {
    const matchesSearch = !searchTerm || 
      session.customer_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.customer_details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Chat Dashboard</h1>
          <p className="text-muted-foreground">Manage customer support chat sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {filteredSessions.length} Sessions
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            {filteredSessions.filter(s => s.is_ai_handled).length} AI Handled
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Chat Sessions</CardTitle>
              <CardDescription>
                {loading ? 'Loading sessions...' : `${filteredSessions.length} sessions found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedSession?.id === session.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedSession(session);
                      loadSessionMessages(session.id);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {session.is_ai_handled ? (
                            <Bot className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="font-medium">
                            {session.customer_details?.name || 'Anonymous'}
                          </span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(session.priority)}>
                          {session.priority}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {session.customer_details?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {session.customer_details.email}
                        </div>
                      )}
                      {session.customer_details?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {session.customer_details.phone}
                        </div>
                      )}
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
                              updateSessionStatus(session.id, 'in-progress');
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
                ))}

                {filteredSessions.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No chat sessions found</p>
                    <p className="text-sm">Sessions will appear here when customers start chatting</p>
                  </div>
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
                <MessageSquare className="w-4 h-4" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSession ? (
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {selectedSession.customer_details?.name || 'Not provided'}
                      </div>
                      {selectedSession.customer_details?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {selectedSession.customer_details.email}
                        </div>
                      )}
                      {selectedSession.customer_details?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {selectedSession.customer_details.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Session Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Session Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(selectedSession.status)}>
                          {selectedSession.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <Badge className={getPriorityColor(selectedSession.priority)}>
                          {selectedSession.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{format(new Date(selectedSession.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                      {selectedSession.customer_details?.issue_type && (
                        <div className="flex justify-between">
                          <span>Issue Type:</span>
                          <span className="capitalize">{selectedSession.customer_details.issue_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Preview */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Messages</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {messages.slice(-3).map((message) => (
                        <div key={message.id} className="text-sm p-2 bg-muted rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {message.author_role === 'customer' ? 
                                selectedSession.customer_details?.name || 'Customer' : 
                                'Support'
                              }
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Actions</h4>
                    <div className="space-y-2">
                      {selectedSession.status === 'open' && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => updateSessionStatus(selectedSession.id, 'in-progress')}
                        >
                          Take Session
                        </Button>
                      )}
                      {selectedSession.status !== 'closed' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => updateSessionStatus(selectedSession.id, 'closed')}
                        >
                          Close Session
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a session to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveChatDashboard;
