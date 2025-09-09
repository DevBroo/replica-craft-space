import { supabase } from '@/integrations/supabase/client';

export interface CustomerDetails {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  issue_type?: string;
  booking_reference?: string;
  property_interest?: string;
  urgency_level?: 'low' | 'medium' | 'high';
  preferred_contact_method?: 'email' | 'phone' | 'chat';
}

export interface AIResponse {
  message: string;
  collected_info?: Partial<CustomerDetails>;
  next_question?: string;
  confidence_score?: number;
  should_escalate?: boolean;
  suggested_actions?: string[];
  adminJoined?: boolean; // Flag to indicate admin has taken over chat
  shouldEscalate?: boolean; // Alternative property name used in some places
  extractedInfo?: any; // For extracted customer information
}

export class AIChatService {
  private static customerDetails: CustomerDetails = {};
  private static conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }> = [];

  /**
   * Process user message and generate AI response
   */
  static async processMessage(userMessage: string, ticketId: string): Promise<AIResponse> {
    try {
      console.log('🤖 Processing AI message:', userMessage);

      // Check if admin has joined the chat - if so, don't respond with AI
      const hasAdminJoined = await this.checkIfAdminJoined(ticketId);
      if (hasAdminJoined) {
        console.log('👮‍♂️ Admin has joined chat - AI will not respond');
        return {
          message: "", // Empty response - AI should not reply
          shouldEscalate: false,
          extractedInfo: {},
          adminJoined: true // Flag to indicate admin has taken over
        };
      }

      // Add user message to conversation history with timestamp
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });

      // Get user role to provide appropriate responses
      const userRole = await this.getUserRole(ticketId);
      console.log('👤 User role detected:', userRole, 'for ticket:', ticketId);

      // Extract information from the message
      const extractedInfo = this.extractCustomerInfo(userMessage);
      console.log('📊 Extracted info:', extractedInfo);

      // Update customer details
      this.customerDetails = { ...this.customerDetails, ...extractedInfo };
      console.log('👤 Updated customer details:', this.customerDetails);

      // Generate AI response based on user role and conversation context
      const aiResponse = await this.generateAIResponse(userMessage, this.customerDetails, userRole);
      console.log('💬 Generated AI response:', aiResponse.message);

      // Add AI response to conversation history with timestamp
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString()
      });

      // Save customer details to database (only if not guest session)
      if (!ticketId.startsWith('guest-')) {
        try {
          await this.saveCustomerDetails(ticketId, this.customerDetails, userRole);
          console.log('💾 Saved customer details to database');
        } catch (saveError) {
          console.warn('⚠️ Failed to save customer details:', saveError);
          // Don't fail the entire process if database save fails
        }
      } else {
        console.log('👤 Guest session - skipping database save');
      }

      return aiResponse;
    } catch (error) {
      console.error('❌ Error processing AI chat message:', error);
      return {
        message: "I apologize, but I'm having trouble processing your request right now. I'm still here to help though! Could you try rephrasing your question?",
        should_escalate: false // Don't escalate immediately on AI errors
      };
    }
  }

  /**
   * Check if admin has joined the chat
   */
  private static async checkIfAdminJoined(ticketId: string): Promise<boolean> {
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .select('assigned_agent, status')
        .eq('id', ticketId)
        .single();

      if (error) {
        console.warn('❌ Error checking admin status:', error);
        return false;
      }

      // Admin has joined if ticket is assigned to an agent and status is in-progress
      return ticket.assigned_agent && ticket.status === 'in-progress';
    } catch (error) {
      console.warn('❌ Error checking if admin joined:', error);
      return false;
    }
  }

  /**
   * Get user role from ticket to provide appropriate AI responses
   */
  private static async getUserRole(ticketId: string): Promise<'customer' | 'property_owner' | 'unknown'> {
    try {
      if (ticketId.startsWith('guest-')) {
        return 'customer'; // Guest users are treated as customers
      }

      // Get ticket details to find the user
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('created_by')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        console.warn('Could not fetch ticket for role detection:', ticketError);
        return 'unknown';
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', ticket.created_by)
        .single();

      if (profileError || !profile) {
        console.warn('Could not fetch user profile for role detection:', profileError);
        return 'unknown';
      }

      console.log('🔍 Role detection - Profile role:', profile.role, 'for user:', ticket.created_by);
      const detectedRole = profile.role === 'property_owner' ? 'property_owner' : 'customer';
      console.log('🎭 Final detected role:', detectedRole);
      return detectedRole;
    } catch (error) {
      console.warn('Error detecting user role:', error);
      return 'unknown';
    }
  }

  /**
   * Extract customer information from message using pattern matching and NLP
   */
  private static extractCustomerInfo(message: string): Partial<CustomerDetails> {
    const extracted: Partial<CustomerDetails> = {};
    const lowerMessage = message.toLowerCase();

    // Extract name using the dedicated method
    const extractedName = this.extractNameFromMessage(message);
    if (extractedName) {
      extracted.name = extractedName;
    }

    // Extract email using the dedicated method
    const extractedEmail = this.extractEmailFromMessage(message);
    if (extractedEmail) {
      extracted.email = extractedEmail;
    }

    // Extract phone number (Indian format)
    const phonePatterns = [
      /(\+91[\s-]?)?([6-9]\d{9})/,
      /(\d{10})/
    ];

    for (const pattern of phonePatterns) {
      const match = message.match(pattern);
      if (match && match[0]) {
        extracted.phone = match[0].replace(/[\s-]/g, '');
        break;
      }
    }

    // Extract booking reference
    const bookingPatterns = [
      /booking.*?([A-Z0-9]{6,})/i,
      /reference.*?([A-Z0-9]{6,})/i,
      /order.*?([A-Z0-9]{6,})/i
    ];

    for (const pattern of bookingPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        extracted.booking_reference = match[1];
        break;
      }
    }

    // Determine issue type
    if (lowerMessage.includes('booking') || lowerMessage.includes('reservation')) {
      extracted.issue_type = 'booking';
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('refund') || lowerMessage.includes('charge')) {
      extracted.issue_type = 'payment';
    } else if (lowerMessage.includes('property') || lowerMessage.includes('location') || lowerMessage.includes('venue')) {
      extracted.issue_type = 'property';
    } else if (lowerMessage.includes('account') || lowerMessage.includes('login') || lowerMessage.includes('password')) {
      extracted.issue_type = 'account';
    }

    // Determine urgency
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('asap')) {
      extracted.urgency_level = 'high';
    } else if (lowerMessage.includes('soon') || lowerMessage.includes('today')) {
      extracted.urgency_level = 'medium';
    }

    return extracted;
  }

  /**
   * Generate contextual AI response
   */
  private static async generateAIResponse(userMessage: string, customerDetails: CustomerDetails, userRole: 'customer' | 'property_owner' | 'unknown' = 'unknown'): Promise<AIResponse> {
    const lowerMessage = userMessage.toLowerCase();

    // Greeting responses - role-specific and more engaging
    if (this.conversationHistory.length <= 2 && (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey') ||
      lowerMessage.includes('good') ||
      lowerMessage.includes('help')
    )) {
      if (userRole === 'property_owner') {
        return {
          message: `Hello! 👋 Welcome to Picnify Property Owner Support! I'm your AI assistant and I'm here to help you manage your properties effectively. \n\nI can assist you with:\n• 🏡 Property listing and management\n• 📊 Booking analytics and insights\n• 💰 Earnings and payment tracking\n• 🎯 Property optimization tips\n• 📅 Calendar and availability management\n• 🔧 Technical support for your listings\n• 📈 Performance metrics and reports\n\nTo get started, could you please tell me your name and what you'd like help with regarding your properties?`,
          next_question: "What's your name and how can I assist you with your properties?"
        };
      } else {
        return {
          message: `Hello! 👋 Welcome to Picnify support! I'm your AI assistant and I'm excited to help you today. \n\nI can assist you with:\n• 🏡 Finding and booking perfect venues\n• 📅 Managing your existing bookings\n• 💳 Payment and billing questions\n• 🎯 Property recommendations\n• 🔧 Technical support\n\nTo get started, could you please tell me your name and what you'd like help with?`,
          next_question: "What's your name and how can I assist you?"
        };
      }
    }

    // Collect missing information
    if (!customerDetails.name) {
      // Check if current message contains a name
      const nameFromMessage = this.extractNameFromMessage(userMessage);
      if (nameFromMessage) {
        // Name found in current message, update details and continue
        this.customerDetails.name = nameFromMessage;
        return {
          message: `Nice to meet you, ${nameFromMessage}! How can I help you today? If you have any specific questions about bookings, payments, or properties, I'm here to assist.`,
          collected_info: { ...this.customerDetails, name: nameFromMessage }
        };
      } else if (!this.isNameInMessage(userMessage)) {
        return {
          message: "Thank you for contacting us! To provide you with personalized assistance, could you please tell me your name?",
          next_question: "What's your name?"
        };
      }
    }

    if (!customerDetails.email && customerDetails.name) {
      // Check if current message contains an email
      const emailFromMessage = this.extractEmailFromMessage(userMessage);
      if (emailFromMessage) {
        // Email found in current message, update details and continue
        this.customerDetails.email = emailFromMessage;
        return {
          message: `Perfect, ${customerDetails.name}! I've got your email as ${emailFromMessage}. Now, how can I help you today? Are you having issues with a booking, payment, property, or something else?`,
          collected_info: { ...this.customerDetails, email: emailFromMessage }
        };
      } else {
        return {
          message: `Nice to meet you, ${customerDetails.name}! Could you please provide your email address so I can look up your account and send you any follow-up information?`,
          next_question: "What's your email address?"
        };
      }
    }

    // Role-specific responses
    if (userRole === 'property_owner') {
      return this.generatePropertyOwnerResponse(userMessage, customerDetails);
    }

    // Issue-specific responses for customers
    if (customerDetails.issue_type === 'booking') {
      if (!customerDetails.booking_reference) {
        return {
          message: "I understand you have a booking-related inquiry. Do you have a booking reference number? This will help me locate your reservation quickly.",
          next_question: "What's your booking reference number?"
        };
      } else {
        return {
          message: `I found your booking reference ${customerDetails.booking_reference}. Let me check the details for you. What specific issue are you experiencing with your booking?`,
          suggested_actions: ['Check booking status', 'Modify booking', 'Cancel booking', 'Contact host']
        };
      }
    }

    if (customerDetails.issue_type === 'payment') {
      return {
        message: "I can help you with payment-related issues. Are you having trouble with a recent payment, need a refund, or have questions about charges? Also, if you have a booking reference, that would be helpful.",
        suggested_actions: ['Check payment status', 'Process refund', 'Dispute charge', 'Update payment method']
      };
    }

    if (customerDetails.issue_type === 'property') {
      return {
        message: "I'd be happy to help you with property-related questions. Are you looking for information about a specific property, having issues with a current booking, or interested in booking a new venue?",
        suggested_actions: ['Search properties', 'Check availability', 'View property details', 'Contact host']
      };
    }

    // Smart contextual responses based on what we know
    if (customerDetails.name && customerDetails.email && customerDetails.issue_type) {
      // We have good information, provide specific help
      return this.generateSpecificHelp(customerDetails, userMessage);
    }

    // If we have name and email but no clear issue, ask intelligently
    if (customerDetails.name && customerDetails.email && !customerDetails.issue_type) {
      return {
        message: `Great, ${customerDetails.name}! I have your details. Now, what brings you to Picnify today? Are you:\n\n• Looking to book a property for an event?\n• Having trouble with an existing booking?\n• Need help with a payment or refund?\n• Interested in listing your property?\n• Something else?\n\nJust let me know what you need help with!`,
        collected_info: customerDetails
      };
    }

    // General helpful response with better context
    const helpContext = this.getHelpContext(userMessage, customerDetails);
    return {
      message: helpContext.message,
      collected_info: customerDetails,
      confidence_score: this.calculateConfidenceScore(customerDetails),
      suggested_actions: helpContext.actions
    };
  }

  /**
   * Check if message contains a name
   */
  private static isNameInMessage(message: string): boolean {
    const nameIndicators = ['my name is', "i'm", 'i am', 'this is', 'call me'];
    const lowerMessage = message.toLowerCase();
    return nameIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Extract name from current message
   */
  private static extractNameFromMessage(message: string): string | null {
    const namePatterns = [
      /my name is ([a-zA-Z\s]+)/i,
      /i'm ([a-zA-Z\s]+)/i,
      /i am ([a-zA-Z\s]+)/i,
      /this is ([a-zA-Z\s]+)/i,
      /call me ([a-zA-Z\s]+)/i,
      /hi,?\s+i'm ([a-zA-Z\s]+)/i,
      /hello,?\s+i'm ([a-zA-Z\s]+)/i,
      /^([a-zA-Z\s]{2,20})$/i // Simple name pattern for standalone names
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 1 && match[1].trim().length < 50) {
        const name = match[1].trim();
        // Avoid common false positives
        const falsePositives = ['help', 'support', 'assistance', 'issue', 'problem', 'booking', 'payment'];
        if (!falsePositives.some(fp => name.toLowerCase().includes(fp))) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Extract email from current message
   */
  private static extractEmailFromMessage(message: string): string | null {
    const emailPatterns = [
      /my email is ([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /email.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i, // Simple email pattern
      /contact.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /reach.*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    ];

    for (const pattern of emailPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const email = match[1].trim().toLowerCase();
        // Basic email validation
        if (email.includes('@') && email.includes('.') && email.length > 5) {
          return email;
        }
      }
    }

    return null;
  }

  /**
   * Generate specific help based on customer details and issue type
   */
  private static generateSpecificHelp(customerDetails: CustomerDetails, userMessage: string): AIResponse {
    const { name, issue_type, booking_reference } = customerDetails;

    switch (issue_type) {
      case 'booking':
        if (booking_reference) {
          return {
            message: `Perfect, ${name}! I can see you have booking reference ${booking_reference}. I'm checking that for you now. What specific issue are you experiencing with this booking? Is it about:\n\n• Changing dates or guest count?\n• Cancellation or refund?\n• Property access or contact details?\n• Special requirements or requests?\n\nLet me know and I'll help you resolve it right away!`,
            suggested_actions: ['Modify booking', 'Cancel booking', 'Contact property', 'Get refund']
          };
        } else {
          return {
            message: `I'm here to help with your booking issue, ${name}! To assist you better, could you provide your booking reference number? You can find it in your confirmation email or booking receipt. Alternatively, tell me what specific problem you're facing and I'll guide you through it.`,
            suggested_actions: ['Find booking reference', 'Describe issue', 'Check email confirmation']
          };
        }

      case 'payment':
        return {
          message: `I understand you're having a payment-related issue, ${name}. I can help you with:\n\n• Refund requests and processing\n• Payment failures or errors\n• Duplicate charges\n• Payment method updates\n• Transaction status checks\n\nWhat specific payment issue are you experiencing? If you have a booking reference or transaction ID, that would be helpful too!`,
          suggested_actions: ['Request refund', 'Report duplicate charge', 'Check payment status', 'Update payment method']
        };

      case 'property':
        return {
          message: `Happy to help with property-related questions, ${name}! Are you:\n\n• Looking for a specific type of venue?\n• Having issues with a property you booked?\n• Interested in listing your own property?\n• Need help with property amenities or policies?\n\nLet me know what you need and I'll provide detailed assistance!`,
          suggested_actions: ['Search properties', 'Property requirements', 'List property', 'Check amenities']
        };

      default:
        return {
          message: `Thanks for providing your details, ${name}! I'm ready to help you. Could you tell me more about what you need assistance with? Whether it's booking a venue, resolving an issue, or getting information about our services, I'm here to help!`,
          suggested_actions: ['Book property', 'Resolve issue', 'Get information', 'Contact support']
        };
    }
  }

  /**
   * Get contextual help based on message content
   */
  private static getHelpContext(userMessage: string, customerDetails: CustomerDetails): { message: string; actions: string[] } {
    const lowerMessage = userMessage.toLowerCase();
    const name = customerDetails.name || 'there';

    // Detect frustration or urgency
    if (lowerMessage.includes('urgent') || lowerMessage.includes('emergency') || lowerMessage.includes('asap') ||
      lowerMessage.includes('help') && lowerMessage.includes('now')) {
      return {
        message: `I understand this is urgent, ${name}! I'm here to help you right away. Please tell me exactly what's happening so I can prioritize your issue and get it resolved quickly. If it's about a booking, payment, or property issue, I can escalate this to our priority support team.`,
        actions: ['Escalate to priority support', 'Immediate assistance', 'Emergency contact']
      };
    }

    // Detect confusion or frustration
    if (lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand') ||
      lowerMessage.includes('frustrated') || lowerMessage.includes('problem')) {
      return {
        message: `I'm sorry you're having trouble, ${name}. Let me help clear things up! I'm here to make this as simple as possible. Could you tell me in your own words what you're trying to do or what issue you're facing? I'll guide you through it step by step.`,
        actions: ['Step-by-step guidance', 'Simplify process', 'Direct assistance']
      };
    }

    // Default helpful response
    return {
      message: `Thank you for the information, ${name}! I'm here to help you with whatever you need. Could you tell me more about what brings you to Picnify today? I can assist with bookings, payments, property questions, or any other concerns you might have.`,
      actions: ['General assistance', 'Booking help', 'Payment support', 'Property information']
    };
  }

  /**
   * Calculate confidence score based on collected information
   */
  private static calculateConfidenceScore(details: CustomerDetails): number {
    let score = 0;
    const fields = Object.keys(details);

    if (details.name) score += 20;
    if (details.email) score += 20;
    if (details.phone) score += 15;
    if (details.issue_type) score += 25;
    if (details.booking_reference) score += 20;

    return Math.min(score, 100);
  }

  /**
   * Save customer details to database
   */
  private static async saveCustomerDetails(ticketId: string, details: CustomerDetails, userRole: 'customer' | 'property_owner' | 'unknown' = 'unknown'): Promise<void> {
    try {
      // Get the current user's profile to get their real name
      const { data: { user } } = await supabase.auth.getUser();
      let realName = details.name;

      if (user && !realName) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          realName = profile.full_name;
          details.name = realName; // Update the details with real name
        }
      }

      // Update the ticket subject to include the customer name
      const updatedSubject = realName ?
        `Live Chat Session - ${realName}` :
        'Live Chat Session';

      const { error } = await supabase
        .from('support_tickets')
        .update({
          subject: updatedSubject,
          customer_email: details.email,
          customer_phone: details.phone,
          description: JSON.stringify({
            customer_details: details,
            conversation_summary: this.conversationHistory.slice(-20), // Keep last 20 messages for better history
            last_updated: new Date().toISOString(),
            user_role: userRole, // Save user role for admin categorization
            chat_type: userRole === 'property_owner' ? 'property_owner_support' : 'customer_support'
          })
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error saving customer details:', error);
      } else {
        console.log('✅ Updated ticket with customer name:', realName);
      }
    } catch (error) {
      console.error('Error updating ticket with customer details:', error);
    }
  }

  /**
   * Get collected customer details
   */
  static getCustomerDetails(): CustomerDetails {
    return { ...this.customerDetails };
  }

  /**
   * Reset conversation for new chat
   */
  static resetConversation(): void {
    this.customerDetails = {};
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  static getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Determine if chat should be escalated to human agent
   */
  static shouldEscalateToHuman(details: CustomerDetails, messageCount: number): boolean {
    // Escalate if high urgency
    if (details.urgency_level === 'high') return true;

    // Escalate if conversation is getting long without resolution
    if (messageCount > 10) return true;

    // Escalate if complex booking issues
    if (details.issue_type === 'booking' && details.booking_reference && messageCount > 5) return true;

    return false;
  }

  /**
   * Generate property owner specific responses
   */
  private static generatePropertyOwnerResponse(userMessage: string, customerDetails: CustomerDetails): AIResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Property management queries
    if (lowerMessage.includes('property') || lowerMessage.includes('listing') || lowerMessage.includes('venue')) {
      return {
        message: "I can help you with your property management! Are you looking to:\n\n• 📝 Update your property listing details\n• 📊 Check your property's performance metrics\n• 📅 Manage your availability calendar\n• 💰 View your earnings and payments\n• 🎯 Get tips to optimize your property\n• 🔧 Fix any technical issues with your listing\n\nWhat specific aspect of your property would you like help with?",
        suggested_actions: ['Update listing', 'View analytics', 'Manage calendar', 'Check earnings', 'Get optimization tips']
      };
    }

    // Booking management queries
    if (lowerMessage.includes('booking') || lowerMessage.includes('reservation') || lowerMessage.includes('guest')) {
      return {
        message: "I can help you manage your bookings! Are you looking to:\n\n• 📋 View upcoming bookings\n• 📊 Check booking analytics\n• 📅 Manage your availability\n• 💬 Communicate with guests\n• 🔄 Handle booking modifications\n• ❌ Process cancellations\n\nWhat would you like to do with your bookings?",
        suggested_actions: ['View bookings', 'Check analytics', 'Manage availability', 'Contact guests']
      };
    }

    // Earnings and payment queries
    if (lowerMessage.includes('earnings') || lowerMessage.includes('payment') || lowerMessage.includes('money') || lowerMessage.includes('revenue')) {
      return {
        message: "I can help you with your earnings and payments! Are you looking to:\n\n• 💰 Check your current earnings\n• 📊 View payment history\n• 📈 Analyze revenue trends\n• 💳 Update payment methods\n• 🏦 Set up payouts\n• 📋 Download financial reports\n\nWhat specific financial information do you need?",
        suggested_actions: ['View earnings', 'Check payments', 'Download reports', 'Update payment method']
      };
    }

    // General property owner help
    return {
      message: `Hello! I'm here to help you manage your properties on Picnify. I can assist you with:\n\n• 🏡 Property listing optimization\n• 📊 Performance analytics and insights\n• 💰 Earnings and payment tracking\n• 📅 Calendar and availability management\n• 📋 Booking management\n• 🎯 Marketing and promotion tips\n• 🔧 Technical support\n\nWhat would you like help with today?`,
      suggested_actions: ['Property management', 'Booking analytics', 'Earnings report', 'Calendar setup']
    };
  }
}
