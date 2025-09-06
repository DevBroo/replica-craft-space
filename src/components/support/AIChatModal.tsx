import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIChat } from '@/hooks/useAIChat';
import { MessageCircle, Send, X, LogIn, Star, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface AIChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ open, onOpenChange }) => {
  const {
    user,
    currentSession,
    messages,
    sendMessage,
    endChat,
    isLoading,
    isSending,
    rateChat
  } = useAIChat();
  
  const [messageText, setMessageText] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug logging
  useEffect(() => {
    console.log('AIChatModal state:', { 
      open, 
      user: !!user, 
      currentSession: !!currentSession, 
      messagesCount: messages.length,
      isLoading,
      isSending 
    });
  }, [open, user, currentSession, messages.length, isLoading, isSending]);

  // Show rating when chat is about to end
  const handleEndChat = async () => {
    if (messages.length > 2) { // Only show rating if there was actual conversation
      setShowRating(true);
    } else {
      await endChat();
      onOpenChange(false);
    }
  };

  const handleRatingSubmit = async () => {
    await endChat(rating);
    onOpenChange(false);
    setShowRating(false);
    setRating(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSendMessage called:', { messageText: messageText.trim(), isSending, currentSession: !!currentSession });
    
    if (!messageText.trim() || isSending) {
      console.log('Cannot send message: empty text or already sending');
      return;
    }

    const text = messageText.trim();
    setMessageText('');
    
    console.log('Calling sendMessage with:', text);
    await sendMessage(text);
  };

  const handleSignIn = () => {
    onOpenChange(false);
    navigate('/login');
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  const isUserMessage = (message: any) => {
    return message.role === 'user';
  };

  const getMessageAuthorName = (message: any) => {
    if (isUserMessage(message)) {
      return user?.email?.split('@')[0] || 'You';
    }
    return 'Picnify AI';
  };

  // Not authenticated view
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Chat Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to Chat with AI</h3>
            <p className="text-muted-foreground mb-6">
              Get instant AI-powered assistance for all your Picnify needs. Sign in to start chatting!
            </p>
            <Button onClick={handleSignIn} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Start AI Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Loading states
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Chat Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Initializing AI chat session...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Rating modal
  if (showRating) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Rate Your Chat Experience
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-6">
              How would you rate your chat experience with our AI assistant?
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    star <= rating 
                      ? 'bg-yellow-400 text-white' 
                      : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleRatingSubmit} 
                className="flex-1"
                disabled={rating === 0}
              >
                Submit Rating
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRating(false);
                  setRating(0);
                }}
                className="flex-1"
              >
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:max-h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              AI Chat Assistant
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                Online
              </span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndChat}
              className="text-muted-foreground hover:text-destructive"
              title="End Chat"
            >
              End Chat
            </Button>
          </div>
          {currentSession && (
            <p className="text-sm text-muted-foreground">
              Chat started {format(new Date(currentSession.created_at), 'MMM d, HH:mm')}
            </p>
          )}
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Welcome! I'm your AI assistant. How can I help you today?
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${isUserMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                {!isUserMessage(message) && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isUserMessage(message)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isUserMessage(message) ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
                
                {isUserMessage(message) && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
              maxLength={1000}
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || isSending}
              size="sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by AI • Your conversation is being recorded for quality improvement
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
