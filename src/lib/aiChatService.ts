import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: {
    user_id?: string;
    session_id?: string;
    intent?: string;
    entities?: any;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  user_id?: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'ended';
  metadata?: {
    user_agent?: string;
    page_url?: string;
    referrer?: string;
    device_type?: string;
  };
}

export interface ChatData {
  session_id: string;
  user_id?: string;
  messages: ChatMessage[];
  intents: string[];
  entities: any[];
  satisfaction_score?: number;
  resolution_status: 'resolved' | 'unresolved' | 'escalated';
  created_at: string;
  updated_at: string;
}

class AIChatService {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize chat session
  async initializeSession(userId?: string): Promise<ChatSession> {
    this.userId = userId;
    
    const session: ChatSession = {
      id: this.sessionId,
      user_id: userId,
      session_id: this.sessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      metadata: {
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        referrer: document.referrer,
        device_type: this.getDeviceType()
      }
    };

    // Save session to database (optional - will work without database)
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .insert([session]);
      
      if (error) {
        console.warn('Chat sessions table not available, continuing without database storage:', error.message);
      }
    } catch (error) {
      console.warn('Database not available, continuing without database storage:', error);
    }

    return session;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Process user message and generate AI response
  async processMessage(content: string): Promise<ChatMessage> {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      metadata: {
        user_id: this.userId,
        session_id: this.sessionId,
        intent: this.detectIntent(content),
        entities: this.extractEntities(content),
        confidence: 0.9
      }
    };

    // Save user message
    await this.saveMessage(userMessage);

    // Generate AI response
    const aiResponse = await this.generateAIResponse(content, userMessage.metadata);
    
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: aiResponse.content,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      metadata: {
        user_id: this.userId,
        session_id: this.sessionId,
        intent: aiResponse.intent,
        entities: aiResponse.entities,
        confidence: aiResponse.confidence
      }
    };

    // Save AI response
    await this.saveMessage(assistantMessage);

    return assistantMessage;
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Intent detection logic
    if (lowerMessage.includes('book') || lowerMessage.includes('reservation') || lowerMessage.includes('booking')) {
      return 'booking';
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return 'cancellation';
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('money')) {
      return 'payment';
    } else if (lowerMessage.includes('property') || lowerMessage.includes('location') || lowerMessage.includes('place')) {
      return 'property_inquiry';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return 'support';
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
      return 'pricing';
    } else if (lowerMessage.includes('availability') || lowerMessage.includes('available') || lowerMessage.includes('check')) {
      return 'availability';
    } else if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities') || lowerMessage.includes('features')) {
      return 'amenities';
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
      return 'contact';
    } else {
      return 'general';
    }
  }

  private extractEntities(message: string): any {
    const entities: any = {};
    
    // Extract phone numbers
    const phoneRegex = /(\+?91[\s-]?)?[6-9]\d{9}/g;
    const phones = message.match(phoneRegex);
    if (phones) {
      entities.phone_numbers = phones;
    }

    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = message.match(emailRegex);
    if (emails) {
      entities.email_addresses = emails;
    }

    // Extract dates
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g;
    const dates = message.match(dateRegex);
    if (dates) {
      entities.dates = dates;
    }

    // Extract locations
    const locations = ['bangalore', 'mumbai', 'delhi', 'goa', 'kerala', 'rajasthan', 'himachal', 'karnataka', 'maharashtra'];
    const foundLocations = locations.filter(loc => message.toLowerCase().includes(loc));
    if (foundLocations.length > 0) {
      entities.locations = foundLocations;
    }

    return entities;
  }

  private async generateAIResponse(message: string, metadata?: any): Promise<any> {
    const intent = metadata?.intent || 'general';
    
    // AI Response templates based on intent
    const responses = {
      booking: {
        content: "I'd be happy to help you with your booking! To get started, please visit our properties page and select your preferred location and dates. You can also tell me more about your requirements - how many guests, preferred property type, or any specific amenities you're looking for?",
        intent: 'booking',
        entities: {},
        confidence: 0.95
      },
      cancellation: {
        content: "I understand you'd like to cancel your booking. For cancellations, please provide your booking reference number or the email address used for booking. Our cancellation policy allows free cancellation up to 24 hours before check-in. Would you like me to help you with the cancellation process?",
        intent: 'cancellation',
        entities: {},
        confidence: 0.9
      },
      payment: {
        content: "I can help you with payment-related questions. We accept all major credit cards, debit cards, UPI, net banking, and digital wallets like Paytm and PhonePe. Payment is processed securely and you'll receive a confirmation email. Is there a specific payment issue you're facing?",
        intent: 'payment',
        entities: {},
        confidence: 0.9
      },
      property_inquiry: {
        content: "Great! I can help you find the perfect property. We have a wide range of properties including villas, resorts, cottages, and farmhouses. Could you tell me more about your preferences - location, property type, number of guests, or any specific amenities you're looking for?",
        intent: 'property_inquiry',
        entities: {},
        confidence: 0.85
      },
      support: {
        content: "I'm here to help! Please describe the issue you're facing and I'll do my best to assist you. If it's something I can't resolve, I'll connect you with our support team. What seems to be the problem?",
        intent: 'support',
        entities: {},
        confidence: 0.8
      },
      pricing: {
        content: "I can help you with pricing information! Our properties have different rates based on location, season, and amenities. Could you tell me which property or location you're interested in? I can provide you with current rates and any available discounts.",
        intent: 'pricing',
        entities: {},
        confidence: 0.9
      },
      availability: {
        content: "I can help you check availability! Please let me know your preferred dates and location, and I'll check what properties are available for your stay. You can also browse our properties page to see real-time availability.",
        intent: 'availability',
        entities: {},
        confidence: 0.9
      },
      amenities: {
        content: "Our properties offer various amenities including swimming pools, gardens, parking, WiFi, kitchen facilities, and more. The specific amenities vary by property. Which property are you interested in? I can provide detailed information about its amenities.",
        intent: 'amenities',
        entities: {},
        confidence: 0.85
      },
      contact: {
        content: "You can reach us through multiple channels: Phone: +91 80 1234 5678 (Mon-Fri 9AM-6PM IST), Email: support@picnify.in, or continue chatting with me here. Is there something specific you'd like to discuss?",
        intent: 'contact',
        entities: {},
        confidence: 0.95
      },
      general: {
        content: "Hello! I'm Picnify's AI assistant. I can help you with bookings, property inquiries, cancellations, payments, and general support. How can I assist you today?",
        intent: 'general',
        entities: {},
        confidence: 0.8
      }
    };

    return responses[intent as keyof typeof responses] || responses.general;
  }

  private async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([message]);
      
      if (error) {
        console.warn('Chat messages table not available, continuing without database storage:', error.message);
      }
    } catch (error) {
      console.warn('Database not available, continuing without database storage:', error);
    }
  }

  // Get chat history for current session
  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('metadata->session_id', this.sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.warn('Chat messages table not available, returning empty history:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.warn('Database not available, returning empty history:', error);
      return [];
    }
  }

  // End chat session and collect data
  async endSession(satisfactionScore?: number): Promise<ChatData> {
    try {
      const messages = await this.getChatHistory();
      const intents = [...new Set(messages.map(msg => msg.metadata?.intent).filter(Boolean))];
      const entities = messages.flatMap(msg => msg.metadata?.entities ? [msg.metadata.entities] : []);

      const chatData: ChatData = {
        session_id: this.sessionId,
        user_id: this.userId,
        messages,
        intents,
        entities,
        satisfaction_score: satisfactionScore,
        resolution_status: this.determineResolutionStatus(messages),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save chat data (optional - will work without database)
      try {
        const { error } = await supabase
          .from('chat_data')
          .insert([chatData]);
        
        if (error) {
          console.warn('Chat data table not available, continuing without database storage:', error.message);
        }
      } catch (error) {
        console.warn('Database not available, continuing without database storage:', error);
      }

      // Update session status (optional)
      try {
        await supabase
          .from('chat_sessions')
          .update({ status: 'ended', updated_at: new Date().toISOString() })
          .eq('session_id', this.sessionId);
      } catch (error) {
        console.warn('Database not available, continuing without database storage:', error);
      }

      return chatData;
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  private determineResolutionStatus(messages: ChatMessage[]): 'resolved' | 'unresolved' | 'escalated' {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') {
      return 'unresolved';
    }

    const content = lastMessage.content.toLowerCase();
    if (content.includes('escalate') || content.includes('human') || content.includes('agent')) {
      return 'escalated';
    } else if (content.includes('resolved') || content.includes('solved') || content.includes('helpful')) {
      return 'resolved';
    }

    return 'unresolved';
  }

  // Get analytics data
  async getAnalytics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('chat_data')
        .select('*');
      
      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return null;
    }
  }
}

export const aiChatService = new AIChatService();
