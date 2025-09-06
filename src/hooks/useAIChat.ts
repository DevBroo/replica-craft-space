import { useState, useEffect, useCallback } from 'react';
import { aiChatService, ChatMessage, ChatSession } from '@/lib/aiChatService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('AI Chat auth check:', user ? 'authenticated' : 'not authenticated');
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      console.log('AI Chat auth state changed:', session?.user ? 'authenticated' : 'not authenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize chat session when opened
  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeChat();
    }
  }, [isOpen, currentSession]);

  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Initializing AI chat session...', { userId: user?.id, isOpen });
      
      const session = await aiChatService.initializeSession(user?.id);
      console.log('Session created:', session);
      setCurrentSession(session);
      
      // Load chat history if exists
      const history = await aiChatService.getChatHistory();
      console.log('Chat history loaded:', history);
      setMessages(history);
      
      // If no history, add welcome message
      if (history.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: `welcome_${Date.now()}`,
          content: "Hello! I'm Picnify's AI assistant. I can help you with bookings, property inquiries, cancellations, payments, and general support. How can I assist you today?",
          role: 'assistant',
          timestamp: new Date().toISOString(),
          metadata: {
            user_id: user?.id,
            session_id: session.session_id,
            intent: 'greeting',
            confidence: 1.0
          }
        };
        console.log('Adding welcome message:', welcomeMessage);
        setMessages([welcomeMessage]);
      }
      
      console.log('AI chat session initialized successfully');
    } catch (error) {
      console.error('Error initializing AI chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    console.log('sendMessage called:', { content, currentSession: !!currentSession, isSending, user: !!user });
    
    if (!currentSession || isSending) {
      console.log('Cannot send message: no session or already sending', { currentSession: !!currentSession, isSending });
      return;
    }

    try {
      setIsSending(true);
      console.log('Sending message to AI:', content);
      
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        metadata: {
          user_id: user?.id,
          session_id: currentSession.session_id
        }
      };
      
      console.log('Adding user message to UI:', userMessage);
      setMessages(prev => [...prev, userMessage]);
      
      // Process message with AI
      console.log('Processing message with AI service...');
      const aiResponse = await aiChatService.processMessage(content);
      console.log('AI response received:', aiResponse);
      
      // Add AI response to UI
      setMessages(prev => [...prev, aiResponse]);
      
      console.log('AI response added to UI');
    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [currentSession, user, isSending]);

  const endChat = useCallback(async (satisfactionScore?: number) => {
    if (!currentSession) return;

    try {
      console.log('Ending AI chat session...');
      
      const chatData = await aiChatService.endSession(satisfactionScore);
      console.log('Chat data collected:', chatData);
      
      // Reset state
      setCurrentSession(null);
      setMessages([]);
      setIsOpen(false);
      
      toast({
        title: "Chat Ended",
        description: "Thank you for chatting with us! Your conversation has been saved.",
      });
    } catch (error) {
      console.error('Error ending AI chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat session.",
        variant: "destructive"
      });
    }
  }, [currentSession]);

  const openChat = useCallback(() => {
    console.log('Opening AI chat');
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    console.log('Closing AI chat');
    setIsOpen(false);
  }, []);

  const rateChat = useCallback((score: number) => {
    console.log('Rating chat:', score);
    // You can implement rating functionality here
    toast({
      title: "Thank you!",
      description: `You rated the chat ${score} stars.`,
    });
  }, []);

  return {
    isOpen,
    openChat,
    closeChat,
    user,
    currentSession,
    messages,
    sendMessage,
    endChat,
    isLoading,
    isSending,
    rateChat
  };
};
