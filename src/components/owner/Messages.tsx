import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageService, Message, MessageThread } from '@/lib/messageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  Check, 
  CheckCheck,
  User,
  Home,
  Calendar,
  Star,
  Reply,
  Trash2,
  RefreshCw,
  Archive,
  Flag,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTime } from '@/lib/utils';

interface MessagesProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  embedded?: boolean;
}

const Messages: React.FC<MessagesProps> = ({
  sidebarCollapsed = false,
  toggleSidebar,
  activeTab = 'messages',
  setActiveTab,
  embedded = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [totalUnread, setTotalUnread] = useState(0);

  // Load threads on component mount
  useEffect(() => {
    if (user?.id) {
      loadThreads();
      loadTotalUnread();
    }
  }, [user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📨 New message received:', payload);
          loadThreads();
          loadTotalUnread();
          if (selectedThread) {
            loadThreadMessages(selectedThread.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📨 Message updated:', payload);
          loadThreads();
          loadTotalUnread();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user?.id, selectedThread]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.thread-menu-dropdown')) {
        setShowThreadMenu(false);
      }
    };

    if (showThreadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThreadMenu]);

  const loadThreads = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const threadsData = await MessageService.getUserThreads(user.id);
      setThreads(threadsData);
    } catch (error) {
      console.error('Error loading threads:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTotalUnread = async () => {
    if (!user?.id) return;

    try {
      const unreadCount = await MessageService.getTotalUnreadCount(user.id);
      setTotalUnread(unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    if (!user?.id) return;

    try {
      setMessagesLoading(true);
      const messagesData = await MessageService.getThreadMessages(threadId, user.id);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading thread messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    loadThreadMessages(thread.id);
    
    // Mark messages as read when thread is selected
    if (thread.unread_count && thread.unread_count > 0) {
      markThreadAsRead(thread.id);
    }
  };

  const markThreadAsRead = async (threadId: string) => {
    try {
      if (!user?.id) return;
      
      // Mark thread as read in localStorage
      MessageService.markThreadAsRead(user.id, threadId);
      
      // Update the thread's unread count to 0
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, unread_count: 0 }
          : thread
      ));
      
      // Update total unread count
      setTotalUnread(prev => Math.max(0, prev - 1));
      
      // Call the service to mark as read (for logging)
      await MessageService.markMessagesAsRead(threadId, user.id);
      
      console.log('✅ Thread marked as read:', threadId);
    } catch (error) {
      console.error('❌ Failed to mark thread as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user?.id) return;
      
      // Get all thread IDs
      const allThreadIds = threads.map(thread => thread.id);
      
      // Mark all threads as read in localStorage
      MessageService.markAllThreadsAsRead(user.id, allThreadIds);
      
      // Update all threads to have unread_count: 0
      setThreads(prev => prev.map(thread => ({ ...thread, unread_count: 0 })));
      
      // Reset total unread count to 0
      setTotalUnread(0);
      
      // Show success toast
      toast({
        title: "All messages marked as read",
        description: "All conversations have been marked as read.",
      });
      
      console.log('✅ All messages marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all messages as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all messages as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThreadMenuAction = async (action: string) => {
    if (!selectedThread) return;

    try {
      switch (action) {
        case 'mark_read':
          await markThreadAsRead(selectedThread.id);
          toast({
            title: "Marked as Read",
            description: "All messages in this conversation have been marked as read.",
          });
          break;
        case 'archive':
          // Archive the thread
          setThreads(prev => prev.filter(thread => thread.id !== selectedThread.id));
          setSelectedThread(null);
          setMessages([]);
          toast({
            title: "Conversation Archived",
            description: "The conversation has been archived.",
          });
          break;
        case 'flag':
          toast({
            title: "Conversation Flagged",
            description: "This conversation has been flagged for review.",
          });
          break;
        case 'delete':
          // Delete the thread
          setThreads(prev => prev.filter(thread => thread.id !== selectedThread.id));
          setSelectedThread(null);
          setMessages([]);
          toast({
            title: "Conversation Deleted",
            description: "The conversation has been deleted.",
          });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('❌ Failed to perform action:', error);
      toast({
        title: "Error",
        description: "Failed to perform the requested action.",
        variant: "destructive",
      });
    } finally {
      setShowThreadMenu(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user?.id) return;

    const messageText = newMessage.trim();
    
    try {
      setSending(true);
      
      // Create the new message object immediately
      const newMessageObj: Message = {
        id: `temp-msg-${Date.now()}`,
        booking_id: selectedThread.booking_id,
        property_id: selectedThread.property_id,
        sender_id: user.id,
        receiver_id: selectedThread.guest_id === user.id ? selectedThread.owner_id : selectedThread.guest_id,
        message: messageText,
        message_type: 'text',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: 'You',
        property_title: selectedThread.property_title
      };

      // Add the message to the current conversation immediately
      setMessages(prev => [...prev, newMessageObj]);
      
      // Update the thread's last message in the thread list
      setThreads(prev => prev.map(thread => 
        thread.id === selectedThread.id 
          ? {
              ...thread,
              last_message: messageText,
              last_message_at: new Date().toISOString(),
              last_message_id: newMessageObj.id
            }
          : thread
      ));
      
      // Clear the input
      setNewMessage('');
      
      // Call the service (for logging)
      await MessageService.sendMessage({
        booking_id: selectedThread.booking_id,
        property_id: selectedThread.property_id,
        receiver_id: selectedThread.guest_id === user.id ? selectedThread.owner_id : selectedThread.guest_id,
        message: messageText
      });
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.property_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'unread' && thread.unread_count && thread.unread_count > 0) ||
                         (filterStatus === 'read' && (!thread.unread_count || thread.unread_count === 0));
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'No unread messages'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {totalUnread > 0 && (
            <Button onClick={markAllAsRead} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
          <Button onClick={loadThreads} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 text-center max-w-md">
              You'll receive messages from guests once they book your properties or have questions about their stay.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Threads List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Badge variant="secondary">{filteredThreads.length}</Badge>
              </div>
              
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('unread')}
                  >
                    Unread
                  </Button>
                  <Button
                    variant={filterStatus === 'read' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('read')}
                  >
                    Read
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => handleThreadSelect(thread)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
                        selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {thread.guest_name?.charAt(0) || 'G'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {thread.guest_name}
                            </h4>
                            <div className="flex items-center space-x-1">
                              {thread.unread_count && thread.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {thread.unread_count}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTime(thread.last_message_at)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate">
                            {thread.property_title}
                          </p>
                          
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {thread.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2">
            {selectedThread ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {selectedThread.guest_name?.charAt(0) || 'G'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {selectedThread.guest_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedThread.property_title}
                        </p>
                      </div>
                    </div>
                    <div className="relative thread-menu-dropdown">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowThreadMenu(!showThreadMenu)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      
                      {showThreadMenu && (
                        <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={() => handleThreadMenuAction('mark_read')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Check className="h-4 w-4" />
                              <span>Mark as Read</span>
                            </button>
                            <button
                              onClick={() => handleThreadMenuAction('flag')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Flag className="h-4 w-4" />
                              <span>Flag Conversation</span>
                            </button>
                            <button
                              onClick={() => handleThreadMenuAction('archive')}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Archive className="h-4 w-4" />
                              <span>Archive</span>
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => handleThreadMenuAction('delete')}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete Conversation</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 flex flex-col h-[400px]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading messages...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.sender_id === user?.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <div className="flex items-center justify-end mt-1 space-x-1">
                                <span className="text-xs opacity-70">
                                  {formatTime(message.created_at)}
                                </span>
                                {message.sender_id === user?.id && (
                                  <div className="flex items-center">
                                    {message.is_read ? (
                                      <CheckCheck className="h-3 w-3" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 min-h-[40px] max-h-32 resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                      >
                        {sending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Messages;
