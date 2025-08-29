
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  User,
  MessageSquare,
  ArrowUpCircle,
  FileText,
  Download,
  Eye,
  EyeOff,
  Flag,
  RefreshCcw,
  GitMerge,
  Star
} from 'lucide-react';
import { supportTicketService, SupportTicket, TicketMessage, TicketAttachment } from '@/lib/supportTicketService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TicketDetailsDrawerProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdate?: () => void;
}

const TicketDetailsDrawer: React.FC<TicketDetailsDrawerProps> = ({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdate
}) => {
  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [showSatisfactionForm, setShowSatisfactionForm] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [satisfactionComment, setSatisfactionComment] = useState('');

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicketData();
      loadAvailableAgents();
    }
  }, [isOpen, ticketId]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const [ticketData, messagesData, attachmentsData] = await Promise.all([
        supportTicketService.getTicketById(ticketId),
        supportTicketService.getTicketMessages(ticketId),
        supportTicketService.getTicketAttachments(ticketId)
      ]);
      
      setTicket(ticketData);
      setMessages(messagesData);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error('Error loading ticket data:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const agents = await supportTicketService.getAvailableAgents();
      setAvailableAgents(agents);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await supportTicketService.addMessage(ticketId, newMessage, isInternal);
      setNewMessage('');
      await loadTicketData();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (const file of files) {
        await supportTicketService.uploadAttachment(ticketId, file, undefined, isInternal);
      }
      await loadTicketData();
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      await supportTicketService.updateStatus(ticketId, newStatus, reason);
      await loadTicketData();
      onTicketUpdate?.();
      toast.success('Ticket status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await supportTicketService.assignAgent(ticketId, agentId);
      await loadTicketData();
      onTicketUpdate?.();
      toast.success('Agent assigned successfully');
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    }
  };

  const handleEscalate = async () => {
    const reason = prompt('Please provide a reason for escalation:');
    if (!reason) return;

    try {
      await supportTicketService.escalateTicket(ticketId, reason);
      await loadTicketData();
      onTicketUpdate?.();
      toast.success('Ticket escalated successfully');
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast.error('Failed to escalate ticket');
    }
  };

  const handleReopenTicket = async () => {
    try {
      await handleStatusChange('open', 'Ticket reopened by admin');
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error('Failed to reopen ticket');
    }
  };

  const handleSubmitSatisfaction = async () => {
    try {
      await supportTicketService.submitSatisfactionRating(ticketId, satisfactionRating, satisfactionComment);
      setShowSatisfactionForm(false);
      await loadTicketData();
      toast.success('Satisfaction rating submitted');
    } catch (error) {
      console.error('Error submitting satisfaction:', error);
      toast.error('Failed to submit satisfaction rating');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in-progress': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-4xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {ticket?.subject}
              </h2>
              <p className="text-sm text-gray-500">Ticket #{ticketId.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {ticket?.escalated && (
              <span className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Escalated
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket?.priority || '')}`}>
              {ticket?.priority}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket?.status || '')}`}>
              {ticket?.status}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Loading ticket details...</div>
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Left Panel - Messages */}
            <div className="flex-1 flex flex-col">
              {/* Ticket Info */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-900">{ticket?.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-900">{formatTimestamp(ticket?.created_at || '')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assigned to:</span>
                    <span className="ml-2 text-gray-900">
                      {ticket?.assigned_agent_profile?.full_name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">SLA Due:</span>
                    <span className="ml-2 text-gray-900">
                      {ticket?.sla_due_at ? formatTimestamp(ticket.sla_due_at) : 'N/A'}
                    </span>
                  </div>
                </div>
                {ticket?.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="mt-1 text-gray-900">{ticket.description}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex space-x-3 ${message.is_internal ? 'bg-yellow-50 p-3 rounded-lg border border-yellow-200' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {(message as any)?.author_profile?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          {(message as any)?.author_profile?.role}
                        </span>
                        {message.is_internal && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                            Internal
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-900">{message.content}</p>
                    </div>
                  </div>
                ))}

                {attachments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="flex-1">{attachment.file_name}</span>
                          {attachment.is_internal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                              Internal
                            </span>
                          )}
                          <button className="text-blue-600 hover:text-blue-800">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t px-6 py-4">
                <div className="flex items-center space-x-2 mb-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Internal note (visible to agents/admins only)</span>
                    {isInternal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </label>
                </div>
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </label>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || uploading}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Actions */}
            <div className="w-80 border-l bg-gray-50 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-4">
                {/* Status Change */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Status
                  </label>
                  <select
                    value={ticket?.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Assign Agent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Agent
                  </label>
                  <select
                    value={ticket?.assigned_agent || ''}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {availableAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Escalate */}
                <button
                  onClick={handleEscalate}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Escalate Ticket</span>
                </button>

                {/* Reopen (if closed) */}
                {ticket?.status === 'closed' && (
                  <button
                    onClick={handleReopenTicket}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Reopen Ticket</span>
                  </button>
                )}

                {/* Satisfaction Rating */}
                {ticket?.status === 'resolved' && !ticket?.satisfaction_rating && (
                  <div>
                    <button
                      onClick={() => setShowSatisfactionForm(true)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Star className="w-4 h-4" />
                      <span>Rate Satisfaction</span>
                    </button>
                  </div>
                )}

                {showSatisfactionForm && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-2">Rate this ticket</h4>
                    <div className="flex space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSatisfactionRating(rating)}
                          className={`p-1 ${satisfactionRating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={satisfactionComment}
                      onChange={(e) => setSatisfactionComment(e.target.value)}
                      placeholder="Optional feedback..."
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      rows={3}
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={handleSubmitSatisfaction}
                        className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowSatisfactionForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Ticket Info */}
                <div className="border-t pt-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Ticket Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reopened:</span>
                      <span className="font-medium">{ticket?.reopened_count || 0} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Escalation Level:</span>
                      <span className="font-medium">{ticket?.escalation_level || 0}</span>
                    </div>
                    {ticket?.satisfaction_rating && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satisfaction:</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-3 h-3 ${
                                ticket.satisfaction_rating! >= rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
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

export default TicketDetailsDrawer;
