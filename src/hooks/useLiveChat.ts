import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supportTicketService } from '@/lib/supportTicketService';
import { AIChatService, CustomerDetails } from '@/lib/aiChatService';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  author_id: string;
  author_role: string;
  created_at: string;
  is_internal: boolean;
  author_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export interface ChatTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

export const useLiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<ChatTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({});
  const [isAIMode, setIsAIMode] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('Live chat auth check:', user ? 'authenticated' : 'not authenticated');
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      console.log('Live chat auth state changed:', session?.user ? 'authenticated' : 'not authenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load saved ticket from localStorage
  useEffect(() => {
    if (user && isOpen) {
      console.log('Loading saved chat ticket for user:', user.id);
      const savedTicketId = localStorage.getItem(`liveChat_${user.id}`);
      if (savedTicketId) {
        console.log('Found saved ticket ID:', savedTicketId);
        loadTicket(savedTicketId);
      } else {
        console.log('No saved ticket found, will create new one');
        getOrCreateChatTicket();
      }
    }
  }, [user, isOpen]);

  // Subscribe to realtime messages when ticket is loaded
  useEffect(() => {
    if (!currentTicket?.id) return;

    console.log('Setting up realtime subscription for ticket:', currentTicket.id);
    
    const channel = supabase
      .channel(`support_chat_${currentTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${currentTicket.id}`
        },
        (payload) => {
          console.log('Realtime message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates by checking if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentTicket?.id]);

  const getOrCreateChatTicketForUser = async (): Promise<ChatTicket> => {
    console.log('Getting or creating chat ticket for user:', user?.id);
    
    // First, try to find an existing open chat ticket
    const existingTickets = await supportTicketService.getTickets({
      status: 'open',
      search: 'Live Chat',
      limit: 1
    });

    console.log('Existing open chat tickets:', existingTickets);

    if (existingTickets.length > 0) {
      const ticket = existingTickets[0];
      console.log('Found existing chat ticket:', ticket.id);
      return {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        created_at: ticket.created_at
      };
    }

    // Create new chat ticket
    console.log('Creating new chat ticket');
    const newTicket = await supportTicketService.createTicket({
      created_by: user!.id,
      subject: 'Live Chat Session',
      description: 'Live chat conversation initiated by user',
      priority: 'medium',
      category: 'Technical'
    });

    console.log('Created new chat ticket:', newTicket);
    return {
      id: newTicket.id,
      subject: newTicket.subject,
      status: newTicket.status,
      created_at: newTicket.created_at
    };
  };

  const loadTicket = async (ticketId: string) => {
    try {
      setIsLoading(true);
      console.log('Loading ticket:', ticketId);
      
      const ticket = await supportTicketService.getTicketById(ticketId);
      console.log('Loaded ticket:', ticket);
      
      if (ticket.status === 'closed') {
        console.log('Ticket is closed, creating new one');
        localStorage.removeItem(`liveChat_${user.id}`);
        await getOrCreateChatTicket();
        return;
      }

      setCurrentTicket({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        created_at: ticket.created_at
      });

      // Load messages
      const ticketMessages = await supportTicketService.getTicketMessages(ticketId);
      console.log('Loaded messages:', ticketMessages);
      setMessages(ticketMessages as any);
    } catch (error) {
      console.error('Error loading ticket:', error);
      // If ticket doesn't exist or access denied, create new one
      localStorage.removeItem(`liveChat_${user.id}`);
      await getOrCreateChatTicket();
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateChatTicket = useCallback(async () => {
    try {
      setIsCreatingTicket(true);
      console.log('Getting or creating chat ticket');
      
      if (!user) {
        // Create guest session
        console.log('Creating guest chat session');
        const guestTicket = {
          id: `guest-${Date.now()}`,
          subject: 'Guest Live Chat Session',
          status: 'open',
          created_at: new Date().toISOString()
        };
        setCurrentTicket(guestTicket);
        
        // Add welcome message for guest
        const welcomeMessage: ChatMessage = {
          id: `welcome-${Date.now()}`,
          content: "Hello! Welcome to Picnify support. I'm an AI assistant here to help you. Since you're not logged in, I can still assist you with general questions. For account-specific issues, you may need to sign in later. How can I help you today?",
          author_id: 'ai-assistant',
          author_role: 'agent',
          created_at: new Date().toISOString(),
          is_internal: false,
          author_profile: {
            full_name: 'AI Assistant',
            email: 'ai@picnify.com',
            role: 'agent'
          }
        };
        setMessages([welcomeMessage]);
        return;
      }
      
      const ticket = await getOrCreateChatTicketForUser();
      setCurrentTicket(ticket);
      
      // Save to localStorage
      localStorage.setItem(`liveChat_${user.id}`, ticket.id);
      console.log('Saved ticket ID to localStorage:', ticket.id);

      // Load existing messages
      const ticketMessages = await supportTicketService.getTicketMessages(ticket.id);
      console.log('Loaded existing messages:', ticketMessages);
      setMessages(ticketMessages as any);
    } catch (error) {
      console.error('Error creating chat ticket:', error);
      
      // Fallback to guest mode if database fails
      console.log('Falling back to guest mode due to error');
      const guestTicket = {
        id: `guest-${Date.now()}`,
        subject: 'Guest Live Chat Session',
        status: 'open',
        created_at: new Date().toISOString()
      };
      setCurrentTicket(guestTicket);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: "Hello! I'm here to help you. Due to a temporary issue, we're running in guest mode. I can still assist you with general questions about Picnify. How can I help you today?",
        author_id: 'ai-assistant',
        author_role: 'agent',
        created_at: new Date().toISOString(),
        is_internal: false,
        author_profile: {
          full_name: 'AI Assistant',
          email: 'ai@picnify.com',
          role: 'agent'
        }
      };
      setMessages([errorMessage]);
    } finally {
      setIsCreatingTicket(false);
    }
  }, [user]);

  const sendMessage = async (content: string) => {
    if (!currentTicket) {
      console.log('Cannot send message: no ticket');
      return;
    }

    try {
      console.log('Sending message:', content);
      
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content,
        author_id: user?.id || 'guest',
        author_role: 'customer',
        created_at: new Date().toISOString(),
        is_internal: false,
        author_profile: {
          full_name: user?.user_metadata?.full_name || customerDetails.name || 'You',
          email: user?.email || customerDetails.email || '',
          role: 'customer'
        }
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to database (only if authenticated)
      if (user && !currentTicket.id.startsWith('guest-')) {
        try {
          await supportTicketService.addMessage(currentTicket.id, content, false);
        } catch (dbError) {
          console.warn('Failed to save message to database:', dbError);
          // Continue with AI processing even if database save fails
        }
      }
      
      // Process with AI if in AI mode
      if (isAIMode) {
        try {
          const aiResponse = await AIChatService.processMessage(content, currentTicket.id);
          setCustomerDetails(AIChatService.getCustomerDetails());
          
          // Add AI response message
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            content: aiResponse.message,
            author_id: 'ai-assistant',
            author_role: 'agent',
            created_at: new Date().toISOString(),
            is_internal: false,
            author_profile: {
              full_name: 'AI Assistant',
              email: 'ai@picnify.com',
              role: 'agent'
            }
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Save AI response to database (only if authenticated)
          if (user && !currentTicket.id.startsWith('guest-')) {
            try {
              await supportTicketService.addMessage(currentTicket.id, aiResponse.message, false, 'ai-assistant');
            } catch (dbError) {
              console.warn('Failed to save AI response to database:', dbError);
            }
          }
          
          // Check if should escalate to human
          if (aiResponse.should_escalate || AIChatService.shouldEscalateToHuman(
            AIChatService.getCustomerDetails(), 
            messages.length + 2
          )) {
            setIsAIMode(false);
            
            // Add escalation message
            const escalationMessage: ChatMessage = {
              id: `escalation-${Date.now()}`,
              content: "I'm connecting you with one of our human support agents who can provide more specialized assistance. They'll be with you shortly!",
              author_id: 'system',
              author_role: 'system',
              created_at: new Date().toISOString(),
              is_internal: false,
              author_profile: {
                full_name: 'System',
                email: 'system@picnify.com',
                role: 'system'
              }
            };
            
            setMessages(prev => [...prev, escalationMessage]);
            
            // Save escalation message and update ticket (only if authenticated)
            if (user && !currentTicket.id.startsWith('guest-')) {
              try {
                await supportTicketService.addMessage(currentTicket.id, escalationMessage.content, false, 'system');
                
                // Update ticket to request human agent
                await supportTicketService.updateTicket(currentTicket.id, {
                  priority: 'high',
                  category: customerDetails.issue_type === 'booking' ? 'Booking' : 
                           customerDetails.issue_type === 'payment' ? 'Payment' : 
                           customerDetails.issue_type === 'property' ? 'Property' : 'Other'
                });
              } catch (dbError) {
                console.warn('Failed to save escalation to database:', dbError);
              }
            }
          }
        } catch (aiError) {
          console.error('❌ AI processing error:', aiError);
          
          // Add error message to chat instead of failing silently
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            content: "I'm experiencing some technical difficulties. Let me try to help you in a different way. Could you please tell me what you need assistance with?",
            author_id: 'ai-assistant',
            author_role: 'agent',
            created_at: new Date().toISOString(),
            is_internal: false,
            author_profile: {
              full_name: 'AI Assistant',
              email: 'ai@picnify.com',
              role: 'agent'
            }
          };
          
          setMessages(prev => [...prev, errorMessage]);
          
          // Don't immediately switch to human mode, give AI another chance
          console.log('⚠️ AI error handled, continuing in AI mode');
        }
      }
      
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Critical error sending message:', error);
      
      // Add error message to chat instead of just showing toast
      const criticalErrorMessage: ChatMessage = {
        id: `critical-error-${Date.now()}`,
        content: "I'm sorry, but I encountered an unexpected error. Please try sending your message again, or refresh the page if the problem persists.",
        author_id: 'system',
        author_role: 'system',
        created_at: new Date().toISOString(),
        is_internal: false,
        author_profile: {
          full_name: 'System',
          email: 'system@picnify.com',
          role: 'system'
        }
      };
      
      setMessages(prev => [...prev, criticalErrorMessage]);
      
      // Still show toast for user awareness
      toast({
        title: "Connection Issue",
        description: "There was a problem sending your message. The chat is still active - please try again.",
        variant: "destructive"
      });
    }
  };

  const endChat = async () => {
    if (!currentTicket) return;

    try {
      console.log('🔚 Ending chat session for ticket:', currentTicket.id);
      
      // Only update database if not guest session
      if (user && !currentTicket.id.startsWith('guest-')) {
        try {
          await supportTicketService.updateStatus(currentTicket.id, 'closed', 'User ended live chat session');
          // Clear from localStorage
          localStorage.removeItem(`liveChat_${user.id}`);
        } catch (dbError) {
          console.warn('⚠️ Failed to update database on chat end:', dbError);
          // Continue with cleanup even if database update fails
        }
      }
      
      // Reset AI service
      AIChatService.resetConversation();
      
      // Reset state
      setCurrentTicket(null);
      setMessages([]);
      setCustomerDetails({});
      setIsAIMode(true);
      setIsOpen(false);
      
      toast({
        title: "Chat Ended",
        description: "Your chat session has been ended. You can start a new one anytime.",
      });
    } catch (error) {
      console.error('❌ Error ending chat:', error);
      
      // Force cleanup even if there's an error
      setCurrentTicket(null);
      setMessages([]);
      setCustomerDetails({});
      setIsAIMode(true);
      setIsOpen(false);
      
      toast({
        title: "Chat Session Ended",
        description: "The chat session has been closed. You can start a new one anytime.",
        variant: "destructive"
      });
    }
  };

  const openChat = () => {
    console.log('Opening live chat');
    setIsOpen(true);
  };

  const closeChat = () => {
    console.log('Closing live chat');
    setIsOpen(false);
  };

  return {
    isOpen,
    openChat,
    closeChat,
    user,
    currentTicket,
    messages,
    sendMessage,
    endChat,
    isLoading,
    isCreatingTicket,
    customerDetails,
    isAIMode
  };
};