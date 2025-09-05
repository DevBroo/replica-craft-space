import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supportTicketService } from '@/lib/supportTicketService';
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
    if (!user) {
      console.log('No user, cannot create chat ticket');
      return;
    }

    try {
      setIsCreatingTicket(true);
      console.log('Getting or creating chat ticket');
      
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
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingTicket(false);
    }
  }, [user]);

  const sendMessage = async (content: string) => {
    if (!currentTicket || !user) {
      console.log('Cannot send message: no ticket or user');
      return;
    }

    try {
      console.log('Sending message:', content);
      await supportTicketService.addMessage(currentTicket.id, content, false);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endChat = async () => {
    if (!currentTicket || !user) return;

    try {
      console.log('Ending chat session for ticket:', currentTicket.id);
      await supportTicketService.updateStatus(currentTicket.id, 'closed', 'User ended live chat session');
      
      // Clear from localStorage
      localStorage.removeItem(`liveChat_${user.id}`);
      
      // Reset state
      setCurrentTicket(null);
      setMessages([]);
      setIsOpen(false);
      
      toast({
        title: "Chat Ended",
        description: "Your chat session has been ended. You can start a new one anytime.",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat session.",
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
    isCreatingTicket
  };
};