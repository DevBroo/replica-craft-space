import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supportTicketService, DatabaseTicket } from '@/lib/supportTicketService';
import { supabase } from '@/integrations/supabase/client';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  Bot,
  AlertCircle,
  CheckCircle,
  Star,
  Send,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TicketDetailsDrawerProps {
  ticket: DatabaseTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetailsDrawer: React.FC<TicketDetailsDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    if (ticket && isOpen) {
      loadMessages();
    }
  }, [ticket, isOpen]);

  const loadMessages = async () => {
    if (!ticket) return;

    try {
      setLoading(true);
      const data = await supportTicketService.getTicketMessages(ticket.id);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!ticket || !newMessage.trim()) return;

    try {
      setSending(true);
      await supportTicketService.addMessage(ticket.id, newMessage.trim());

      toast.success(`Admin message sent successfully`, {
        description: `Your message has been delivered to the customer.`,
        duration: 3000,
      });

      setNewMessage('');
      loadMessages();
      onUpdate();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      await supportTicketService.updateStatus(ticket.id, newStatus, `Status updated to ${newStatus} by admin`);
      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus}`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const parseTicketDescription = (description: string) => {
    try {
      return JSON.parse(description);
    } catch {
      return { customer_details: {}, conversation_summary: [] };
    }
  };

  if (!isOpen || !ticket) return null;

  const parsedDescription = parseTicketDescription(ticket.description || '{}');
  const customerDetails = parsedDescription.customer_details || {};
  const conversationSummary = parsedDescription.conversation_summary || [];

  // Combine conversation summary and actual messages
  const allMessages = [
    ...conversationSummary.map((msg: any, index: number) => ({
      ...msg,
      id: `summary-${index}`,
      source: 'summary',
      timestamp: msg.timestamp || new Date().toISOString()
    })),
    ...messages.map(msg => ({
      ...msg,
      source: 'database',
      timestamp: msg.created_at
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{ticket.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'closed' ? 'destructive' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                  <Badge variant="outline">{ticket.priority || 'Normal'}</Badge>
                  <Badge variant="outline">{ticket.category || 'General'}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Customer Info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{customerDetails.name || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{customerDetails.email || 'Not provided'}</span>
                      </div>
                      {customerDetails.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{customerDetails.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Created: {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Updated: {format(new Date(ticket.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complete Chat History */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Complete Chat History</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullHistory(!showFullHistory)}
                    >
                      {showFullHistory ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showFullHistory ? 'Hide' : 'Show'} Full History
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {allMessages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No messages yet</p>
                    ) : (
                      allMessages.map((msg, index) => (
                        <div key={msg.id || index} className="flex gap-3">
                          <div className="flex-shrink-0">
                            {msg.author_role === 'ai_assistant' ? (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-blue-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {msg.author_role === 'ai_assistant' ? 'AI Assistant' :
                                  msg.author_profile?.full_name || 'Customer'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(msg.timestamp), 'MMM dd, HH:mm')}
                              </span>
                              {msg.source === 'database' && (
                                <Badge variant="outline" className="text-xs">Live</Badge>
                              )}
                              {msg.source === 'summary' && (
                                <Badge variant="secondary" className="text-xs">Summary</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Message Input - Only for open tickets */}
              {ticket.status === 'open' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Send Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="message">Your message to the customer</Label>
                        <Textarea
                          id="message"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message here..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {sending ? 'Sending...' : 'Send Message'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Closed ticket message */}
              {ticket.status === 'closed' && (
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <div className="text-center py-4">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Closed</h3>
                      <p className="text-gray-500">This chat session has ended. You can view the history above.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsDrawer;
