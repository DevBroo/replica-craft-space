import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLiveChat, ChatMessage } from '@/hooks/useLiveChat';
import { MessageCircle, Send, X, LogIn, Clock, Bot, User, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface LiveChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string | null;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({ open, onOpenChange, ticketId }) => {
  const {
    user,
    currentTicket,
    messages,
    sendMessage,
    endChat,
    isLoading,
    isCreatingTicket,
    openChat,
    closeChat,
    customerDetails,
    isAIMode
  } = useLiveChat(ticketId);

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open chat when modal opens
  useEffect(() => {
    if (open) {
      openChat();
    } else {
      closeChat();
    }
  }, [open, openChat, closeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || isSending || !currentTicket) return;

    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage(text);
      console.log('Message sent from modal');
    } catch (error) {
      console.error('Error sending message from modal:', error);
      setMessageText(text); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleEndChat = async () => {
    await endChat();
    onOpenChange(false);
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  const isUserMessage = (message: ChatMessage) => {
    return message.author_id === user?.id;
  };

  const getMessageAuthorName = (message: ChatMessage) => {
    if (isUserMessage(message)) {
      return 'You';
    }
    return message.author_profile?.full_name || 'Support Agent';
  };

  // Guest mode information (removed authentication requirement)
  const isGuestMode = !user;

  // Loading states
  if (isLoading || isCreatingTicket) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Live Chat
            </DialogTitle>
          </DialogHeader>

          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {isCreatingTicket ? 'Starting chat session...' : 'Loading chat...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:max-h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Live Chat
              {isAIMode && <Badge variant="secondary" className="flex items-center gap-1">
                <Bot className="w-3 h-3" />
                AI Assistant
              </Badge>}
              {!isAIMode && <Badge variant="default" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Human Agent
              </Badge>}
              {currentTicket?.status && (
                <span className={`text-xs px-2 py-1 rounded-full ${currentTicket.status === 'open' ? 'bg-green-100 text-green-800' :
                    currentTicket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {currentTicket.status}
                </span>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndChat}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {currentTicket && (
                <p className="text-sm text-muted-foreground">
                  {isGuestMode ? 'Guest Chat Session' : `Chat started ${format(new Date(currentTicket.created_at), 'MMM d, HH:mm')}`}
                </p>
              )}
              {customerDetails.name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3 h-3" />
                  {customerDetails.name}
                  {customerDetails.email && (
                    <>
                      <Mail className="w-3 h-3 ml-2" />
                      {customerDetails.email}
                    </>
                  )}
                </div>
              )}
            </div>
            {isGuestMode && (
              <div className="text-xs text-muted-foreground bg-yellow-50 px-2 py-1 rounded">
                💡 Guest mode - Sign in for full account support
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {isGuestMode
                  ? "Welcome to Picnify support! Our AI assistant is ready to help. Send a message to get started."
                  : "Welcome to live chat! Send a message to get started."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isUserMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${isUserMessage(message)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                      }`}
                  >
                    <div className="text-sm">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isUserMessage(message) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                      <span>{getMessageAuthorName(message)}</span>
                      <span>•</span>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          {currentTicket?.status === 'closed' ? (
            <div className="text-center py-2">
              <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                This chat session has ended. You can start a new one anytime.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={isSending || !currentTicket}
                className="flex-1"
                maxLength={1000}
              />
              <Button
                type="submit"
                disabled={!messageText.trim() || isSending || !currentTicket}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};