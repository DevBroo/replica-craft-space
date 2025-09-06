import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageService, MessageThread, Message } from '@/lib/messageService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, ArrowLeft, Search, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerMessagesProps {
  className?: string;
}

const CustomerMessages: React.FC<CustomerMessagesProps> = ({ className }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadThreads();
    }
  }, [user?.id]);

  // Real-time subscriptions for live messaging
  useEffect(() => {
    if (!user?.id) return;

    const messagesSubscription = supabase
      .channel('customer_messages')
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
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user?.id, selectedThread]);

  const loadThreads = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading threads for user:', user.id);
      const threadsData = await MessageService.getUserThreads(user.id);
      console.log('📨 Threads loaded:', threadsData);
      setThreads(threadsData);
    } catch (error) {
      console.error('❌ Error loading threads:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const messagesData = await MessageService.getThreadMessages(threadId);
      setMessages(messagesData);
      
      // Mark messages as read
      await MessageService.markMessagesAsRead(threadId, user!.id);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user?.id) return;

    const messageText = newMessage.trim();
    setSending(true);
    
    try {
      // Create the new message object for immediate UI update
      const newMessageObj: Message = {
        id: `temp-msg-${Date.now()}`,
        booking_id: selectedThread.booking_id,
        property_id: selectedThread.property_id,
        sender_id: user.id,
        receiver_id: selectedThread.owner_id,
        message: messageText,
        message_type: 'text',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: 'You',
        property_title: selectedThread.property_title
      };

      // Add message to UI immediately
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');

      // Update thread list
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

      // Send to server
      await MessageService.sendMessage({
        booking_id: selectedThread.booking_id,
        property_id: selectedThread.property_id,
        receiver_id: selectedThread.owner_id,
        message: messageText
      });

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the property owner.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to Send",
        description: "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
    loadThreadMessages(thread.id);
  };

  const filteredThreads = threads.filter(thread =>
    thread.property_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-[600px] ${className}`}>
      {/* Threads List */}
      <div className={`${selectedThread ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Messages</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadThreads}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You can only message property owners for properties you have booked.
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                💡 Go to "My Bookings" tab and click "Message Host" to start a conversation.
              </p>
              <div className="text-xs text-muted-foreground">
                <p>🔍 Debug Info:</p>
                <p>User ID: {user?.id}</p>
                <p>Threads loaded: {threads.length}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => handleThreadSelect(thread)}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {thread.owner_name?.charAt(0) || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">
                        {thread.owner_name || 'Property Owner'}
                      </h4>
                      {thread.unread_count && thread.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.property_title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {thread.last_message || 'No messages yet'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(thread.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedThread ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedThread(null)}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {selectedThread.owner_name?.charAt(0) || 'O'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{selectedThread.owner_name || 'Property Owner'}</h4>
                <p className="text-sm text-muted-foreground">{selectedThread.property_title}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.trim()}
                  size="sm"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMessages;
