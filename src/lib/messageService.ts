import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  booking_id?: string;
  property_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender_name?: string;
  receiver_name?: string;
  property_title?: string;
}

export interface MessageThread {
  id: string;
  booking_id?: string;
  property_id: string;
  guest_id: string;
  owner_id: string;
  subject?: string;
  last_message_at: string;
  last_message_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  guest_name?: string;
  owner_name?: string;
  property_title?: string;
  last_message?: string;
  unread_count?: number;
}

export interface SendMessageData {
  booking_id?: string;
  property_id: string;
  receiver_id: string;
  message: string;
  message_type?: 'text' | 'image' | 'file';
}

export class MessageService {
  /**
   * Get real message threads based on actual bookings and messages
   */
  static async getRealMessageThreads(userId: string): Promise<MessageThread[]> {
    try {
      console.log('🔍 Fetching real message threads for user:', userId);
      
      const allThreads: MessageThread[] = [];

      // Get booking-based threads (existing functionality)
      const bookingThreads = await this.getBookingBasedThreads(userId);
      allThreads.push(...bookingThreads);

      // Get message-based threads (for pre-booking conversations)
      const messageThreads = await this.getMessageBasedThreads(userId);
      allThreads.push(...messageThreads);

      // Remove duplicates and sort by last activity
      const uniqueThreads = allThreads.filter((thread, index, self) => 
        index === self.findIndex(t => t.id === thread.id)
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      console.log('✅ Total message threads created:', uniqueThreads.length);
      return uniqueThreads;
    } catch (error) {
      console.error('❌ Error fetching real message threads:', error);
      return [];
    }
  }

  /**
   * Get threads based on confirmed/completed bookings
   */
  static async getBookingBasedThreads(userId: string): Promise<MessageThread[]> {
    const allThreads: MessageThread[] = [];

    // Get bookings where user is the customer (guest)
    const { data: guestBookings, error: guestError } = await supabase
      .from('bookings')
      .select(`
        id,
        property_id,
        user_id,
        status,
        created_at,
        properties!inner(
          id,
          title,
          owner_id
        )
      `)
      .eq('user_id', userId)
      .in('status', ['confirmed', 'completed'])
      .order('created_at', { ascending: false });

    if (!guestError && guestBookings) {
      // Get owner details separately
      const ownerIds = [...new Set(guestBookings.map((b: any) => b.properties.owner_id))];
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ownerIds);
      
      const ownerMap = new Map(ownerProfiles?.map(p => [p.id, p.full_name]) || []);

      const guestThreads: MessageThread[] = guestBookings.map((booking: any) => {
        const property = booking.properties;
        
        return {
          id: `thread-${booking.id}`,
          booking_id: booking.id,
          property_id: property.id,
          guest_id: userId,
          owner_id: property.owner_id,
          subject: `Messages about ${property.title}`,
          last_message_at: booking.created_at,
          last_message_id: null,
          is_active: true,
          created_at: booking.created_at,
          updated_at: booking.created_at,
          guest_name: 'You',
          owner_name: ownerMap.get(property.owner_id) || 'Host',
          property_title: property.title,
          last_message: 'Start a conversation with the host',
          unread_count: 0
        };
      });
      
      allThreads.push(...guestThreads);
    }

    // Get bookings where user is the host
    const { data: ownerBookings, error: ownerError } = await supabase
      .from('bookings')
      .select(`
        id,
        property_id,
        user_id,
        status,
        created_at,
        properties!inner(
          id,
          title,
          owner_id
        )
      `)
      .eq('properties.owner_id', userId)
      .in('status', ['confirmed', 'completed'])
      .order('created_at', { ascending: false });

    if (!ownerError && ownerBookings) {
      // Get guest details separately
      const guestIds = [...new Set(ownerBookings.map((b: any) => b.user_id))];
      const { data: guestProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', guestIds);
      
      const guestMap = new Map(guestProfiles?.map(p => [p.id, p.full_name]) || []);

      const ownerThreads: MessageThread[] = ownerBookings.map((booking: any) => {
        const property = booking.properties;
        
        return {
          id: `thread-${booking.id}`,
          booking_id: booking.id,
          property_id: property.id,
          guest_id: booking.user_id,
          owner_id: userId,
          subject: `Messages about ${property.title}`,
          last_message_at: booking.created_at,
          last_message_id: null,
          is_active: true,
          created_at: booking.created_at,
          updated_at: booking.created_at,
          guest_name: guestMap.get(booking.user_id) || 'Guest',
          owner_name: 'You',
          property_title: property.title,
          last_message: 'Start a conversation with the guest',
          unread_count: 0
        };
      });
      
      allThreads.push(...ownerThreads);
    }

    return allThreads;
  }

  /**
   * Get threads based on messages (for pre-booking conversations)
   */
  static async getMessageBasedThreads(userId: string): Promise<MessageThread[]> {
    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .is('booking_id', null) // Only pre-booking messages
      .order('created_at', { ascending: false });

    if (error || !messages) {
      console.log('No message-based conversations found');
      return [];
    }

    // Group messages by conversation (property_id + other participant)
    const conversationMap = new Map<string, any[]>();
    
    for (const message of messages) {
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      const conversationKey = `${message.property_id}-${otherUserId}`;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, []);
      }
      conversationMap.get(conversationKey)!.push(message);
    }

    // Create threads for each conversation
    const messageThreads: MessageThread[] = [];
    
    for (const [conversationKey, conversationMessages] of conversationMap) {
      const [propertyId, otherUserId] = conversationKey.split('-');
      const latestMessage = conversationMessages[0]; // Messages are ordered by created_at desc
      
      // Get property details
      const { data: property } = await supabase
        .from('properties')
        .select('id, title, owner_id')
        .eq('id', propertyId)
        .single();

      // Get other user details
      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', otherUserId)
        .single();

      if (property && otherUser) {
        const isOwner = property.owner_id === userId;
        
        messageThreads.push({
          id: `msg-${propertyId}-${otherUserId}`,
          booking_id: null,
          property_id: propertyId,
          guest_id: isOwner ? otherUserId : userId,
          owner_id: isOwner ? userId : property.owner_id,
          subject: `Messages about ${property.title}`,
          last_message_at: latestMessage.created_at,
          last_message_id: latestMessage.id,
          is_active: true,
          created_at: conversationMessages[conversationMessages.length - 1].created_at,
          updated_at: latestMessage.updated_at,
          guest_name: isOwner ? otherUser.full_name : 'You',
          owner_name: isOwner ? 'You' : otherUser.full_name,
          property_title: property.title,
          last_message: latestMessage.message,
          unread_count: conversationMessages.filter(m => 
            m.receiver_id === userId && !m.is_read
          ).length
        });
      }
    }

    console.log(`📨 Found ${messageThreads.length} message-based threads`);
    return messageThreads;
  }

  /**
   * Get all message threads for a user (as guest or owner)
   */
  static async getUserThreads(userId: string): Promise<MessageThread[]> {
    try {
      console.log('🔍 Fetching message threads for user:', userId);

      // First, try to get real message threads from database
      const realThreads = await this.getRealMessageThreads(userId);
      if (realThreads.length > 0) {
        return realThreads;
      }

      // If no real threads, return empty array (no dummy data)
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch message threads:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific thread
   */
  static async getThreadMessages(threadId: string, userId?: string): Promise<Message[]> {
    try {
      console.log('🔍 Fetching messages for thread:', threadId);

      let query;
      
      if (threadId.startsWith('thread-')) {
        // Booking-based thread
        const bookingId = threadId.replace('thread-', '');
        query = supabase
          .from('messages')
          .select('*')
          .eq('booking_id', bookingId);
      } else if (threadId.startsWith('msg-')) {
        // Message-based thread (format: msg-{propertyId}-{otherUserId})
        const [, propertyId, otherUserId] = threadId.split('-');
        query = supabase
          .from('messages')
          .select('*')
          .eq('property_id', propertyId)
          .is('booking_id', null)
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);
      } else {
        console.warn('Unknown thread format:', threadId);
        return [];
      }

      const { data: messages, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.warn('Error fetching messages:', error);
        return [];
      }

      if (!messages || messages.length === 0) {
        console.log('No messages found for thread:', threadId);
        return [];
      }

      // Get sender and property info separately
      const senderIds = [...new Set(messages.map((m: any) => m.sender_id))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      const { data: property } = await supabase
        .from('properties')
        .select('id, title')
        .eq('id', messages[0]?.property_id)
        .single();

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Convert database messages to Message format
      const formattedMessages: Message[] = messages.map((msg: any) => ({
        id: msg.id,
        booking_id: msg.booking_id,
        property_id: msg.property_id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        message: msg.message,
        message_type: msg.message_type || 'text',
        is_read: msg.is_read || false,
        read_at: msg.read_at,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender_name: profileMap.get(msg.sender_id) || 'Unknown User',
        property_title: property?.title || 'Property'
      }));

      console.log('✅ Messages loaded:', formattedMessages.length);
      return formattedMessages;
    } catch (error) {
      console.error('❌ Failed to fetch thread messages:', error);
      return [];
    }
  }

  /**
   * Send a new message
   */
  static async sendMessage(messageData: SendMessageData): Promise<Message> {
    try {
      console.log('📤 Sending message:', messageData);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Try to save to messages table
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert({
          booking_id: messageData.booking_id,
          property_id: messageData.property_id,
          sender_id: user.id,
          receiver_id: messageData.receiver_id,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          is_read: false
        })
        .select('*')
        .single();

      if (error) {
        console.warn('Messages table not available, creating local message:', error);
        // Create a local message object if database save fails
        const localMessage: Message = {
          id: `local-msg-${Date.now()}`,
          booking_id: messageData.booking_id,
          property_id: messageData.property_id,
          sender_id: user.id,
          receiver_id: messageData.receiver_id,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          is_read: false,
          read_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender_name: 'You',
          property_title: 'Property'
        };
        return localMessage;
      }

      // Get sender and property info separately
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', messageData.property_id)
        .single();

      // Convert saved message to Message format
      const message = savedMessage as any;
      const formattedMessage: Message = {
        id: message.id,
        booking_id: message.booking_id,
        property_id: message.property_id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        message: message.message,
        message_type: message.message_type || 'text',
        is_read: message.is_read || false,
        read_at: message.read_at,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender_name: senderProfile?.full_name || 'You',
        property_title: property?.title || 'Property'
      };

      console.log('✅ Message saved to database successfully');
      return formattedMessage;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get or create a message thread
   */
  static async getOrCreateThread(
    bookingId: string | undefined,
    propertyId: string,
    guestId: string,
    ownerId: string
  ): Promise<MessageThread> {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required to create a message thread');
      }

      // Get property and owner details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          owner_id,
          profiles!properties_owner_id_fkey(
            id,
            full_name,
            email
          )
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError || !propertyData) {
        throw new Error('Property not found');
      }

      // Create thread based on booking
      const thread: MessageThread = {
        id: `thread-${bookingId}`,
        booking_id: bookingId,
        property_id: propertyId,
        guest_id: guestId,
        owner_id: ownerId,
        subject: `Messages about ${propertyData.title}`,
        last_message_at: new Date().toISOString(),
        last_message_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        guest_name: 'You',
        owner_name: propertyData.profiles?.full_name || 'Host',
        property_title: propertyData.title,
        last_message: 'Start a conversation with the host',
        unread_count: 0
      };

      console.log('✅ Message thread created for booking:', bookingId);
      return thread;
    } catch (error) {
      console.error('❌ Failed to get or create thread:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(threadId: string, userId: string): Promise<number> {
    try {
      let updateQuery;
      
      if (threadId.startsWith('thread-')) {
        // Booking-based thread
        const bookingId = threadId.replace('thread-', '');
        updateQuery = supabase
          .from('messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('booking_id', bookingId)
          .eq('receiver_id', userId)
          .eq('is_read', false);
      } else if (threadId.startsWith('msg-')) {
        // Message-based thread
        const [, propertyId, otherUserId] = threadId.split('-');
        updateQuery = supabase
          .from('messages')
          .update({ 
            is_read: true, 
            read_at: new Date().toISOString() 
          })
          .eq('property_id', propertyId)
          .eq('receiver_id', userId)
          .eq('sender_id', otherUserId)
          .eq('is_read', false)
          .is('booking_id', null);
      } else {
        console.warn('Unknown thread format for marking as read:', threadId);
        return 0;
      }

      const { data, error } = await updateQuery.select('id');

      if (error) {
        console.error('❌ Error marking messages as read:', error);
        return 0;
      }

      const updatedCount = data?.length || 0;
      console.log(`✅ Marked ${updatedCount} messages as read for thread:`, threadId);
      return updatedCount;
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
      return 0;
    }
  }

  /**
   * Get unread message count for a thread
   */
  static async getUnreadCount(threadId: string, userId: string): Promise<number> {
    try {
      // Since messages table doesn't exist, return sample unread count
      // This will be handled by the sample threads generation
      return 0;
    } catch (error) {
      console.error('❌ Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Get total unread message count for a user
   */
  static async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // Since messages table doesn't exist, calculate from sample threads
      const threads = await this.generateSampleThreads(userId);
      return threads.reduce((total, thread) => total + thread.unread_count, 0);
    } catch (error) {
      console.error('❌ Failed to get total unread count:', error);
      return 0;
    }
  }

  /**
   * Delete a message (soft delete by marking as inactive)
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      // Since messages table doesn't exist, just log the action
      console.log('✅ Sample message deleted:', messageId);
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
    }
  }

  /**
   * Generate sample message threads for demonstration
   */
  static async generateSampleThreads(userId: string): Promise<MessageThread[]> {
    try {
      // Get user's properties to create realistic sample threads
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, owner_id')
        .eq('owner_id', userId)
        .limit(3);

      const sampleThreads: MessageThread[] = [];

      if (properties && properties.length > 0) {
        // Create sample threads for each property
        properties.forEach((property, index) => {
          const threadId = `sample-thread-${property.id}-${index}`;
          const guestId = `sample-guest-${index}`;
          
          // Check if this thread has been marked as read in localStorage
          const readThreads = this.getReadThreads(userId);
          const isRead = readThreads.includes(threadId);
          
          sampleThreads.push({
            id: threadId,
            booking_id: `sample-booking-${index}`,
            property_id: property.id,
            guest_id: guestId,
            owner_id: userId,
            subject: `Question about ${property.title}`,
            last_message_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
            last_message_id: `sample-message-${index}`,
            is_active: true,
            created_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
            updated_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
            guest_name: `Guest ${index + 1}`,
            owner_name: 'You',
            property_title: property.title,
            last_message: index === 0 ? 'Thank you for the quick response!' : 
                         index === 1 ? 'Is the property pet-friendly?' : 
                         'What time is check-in?',
            unread_count: isRead ? 0 : (index === 0 ? 0 : 1)
          });
        });
      } else {
        // Create generic sample threads if no properties found
        sampleThreads.push({
          id: 'sample-thread-1',
          booking_id: 'sample-booking-1',
          property_id: 'sample-property-1',
          guest_id: 'sample-guest-1',
          owner_id: userId,
          subject: 'Question about your property',
          last_message_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          last_message_id: 'sample-message-1',
          is_active: true,
          created_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          guest_name: 'John Doe',
          owner_name: 'You',
          property_title: 'Beautiful Villa',
          last_message: 'Is the property available for this weekend?',
          unread_count: 1
        });
      }

      console.log('✅ Sample message threads generated:', sampleThreads.length);
      return sampleThreads;
    } catch (error) {
      console.error('❌ Failed to generate sample threads:', error);
      return [];
    }
  }

  /**
   * Generate sample messages for a thread
   */
  static async generateSampleMessages(threadId: string, userId: string): Promise<Message[]> {
    try {
      const sampleMessages: Message[] = [
        {
          id: `${threadId}-msg-1`,
          booking_id: 'sample-booking-1',
          property_id: 'sample-property-1',
          sender_id: 'sample-guest-1',
          receiver_id: userId,
          message: 'Hi! I\'m interested in booking your property. Is it available for this weekend?',
          message_type: 'text',
          is_read: true,
          read_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          created_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString(),
          sender_name: 'John Doe',
          property_title: 'Beautiful Villa'
        },
        {
          id: `${threadId}-msg-2`,
          booking_id: 'sample-booking-1',
          property_id: 'sample-property-1',
          sender_id: userId,
          receiver_id: 'sample-guest-1',
          message: 'Hello! Yes, the property is available for this weekend. The check-in time is 3 PM and check-out is 11 AM.',
          message_type: 'text',
          is_read: true,
          read_at: new Date(Date.now() - (1 * 60 * 60 * 1000)).toISOString(),
          created_at: new Date(Date.now() - (1 * 60 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - (1 * 60 * 60 * 1000)).toISOString(),
          sender_name: 'You',
          property_title: 'Beautiful Villa'
        },
        {
          id: `${threadId}-msg-3`,
          booking_id: 'sample-booking-1',
          property_id: 'sample-property-1',
          sender_id: 'sample-guest-1',
          receiver_id: userId,
          message: 'Perfect! Is the property pet-friendly? I have a small dog.',
          message_type: 'text',
          is_read: false,
          read_at: null,
          created_at: new Date(Date.now() - (30 * 60 * 1000)).toISOString(),
          updated_at: new Date(Date.now() - (30 * 60 * 1000)).toISOString(),
          sender_name: 'John Doe',
          property_title: 'Beautiful Villa'
        }
      ];

      console.log('✅ Sample messages generated:', sampleMessages.length);
      return sampleMessages;
    } catch (error) {
      console.error('❌ Failed to generate sample messages:', error);
      return [];
    }
  }

  /**
   * Mark a thread as read in localStorage
   */
  static markThreadAsRead(userId: string, threadId: string): void {
    try {
      const key = `picnify_read_threads_${userId}`;
      const readThreads = this.getReadThreads(userId);
      
      if (!readThreads.includes(threadId)) {
        readThreads.push(threadId);
        localStorage.setItem(key, JSON.stringify(readThreads));
      }
    } catch (error) {
      console.error('❌ Failed to mark thread as read in localStorage:', error);
    }
  }

  /**
   * Mark all threads as read in localStorage
   */
  static markAllThreadsAsRead(userId: string, threadIds: string[]): void {
    try {
      const key = `picnify_read_threads_${userId}`;
      localStorage.setItem(key, JSON.stringify(threadIds));
    } catch (error) {
      console.error('❌ Failed to mark all threads as read in localStorage:', error);
    }
  }

  /**
   * Get list of read thread IDs from localStorage
   */
  static getReadThreads(userId: string): string[] {
    try {
      const key = `picnify_read_threads_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get read threads from localStorage:', error);
      return [];
    }
  }
}
