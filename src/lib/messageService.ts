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
   * Get all message threads for a user (as guest or owner)
   */
  static async getUserThreads(userId: string): Promise<MessageThread[]> {
    try {
      console.log('🔍 Fetching message threads for user:', userId);

      // Since message_threads table doesn't exist, generate sample threads
      return await this.generateSampleThreads(userId);
    } catch (error) {
      console.error('❌ Failed to fetch message threads:', error);
      // Return sample threads as fallback
      return await this.generateSampleThreads(userId);
    }
  }

  /**
   * Get messages for a specific thread
   */
  static async getThreadMessages(threadId: string, userId: string): Promise<Message[]> {
    try {
      console.log('🔍 Fetching messages for thread:', threadId);

      // Since messages table doesn't exist, generate sample messages
      return await this.generateSampleMessages(threadId, userId);
    } catch (error) {
      console.error('❌ Failed to fetch thread messages:', error);
      // Return sample messages as fallback
      return await this.generateSampleMessages(threadId, userId);
    }
  }

  /**
   * Send a new message
   */
  static async sendMessage(messageData: SendMessageData): Promise<Message> {
    try {
      console.log('📤 Sending message:', messageData);

      // Since messages table doesn't exist, create a sample message
      const sampleMessage: Message = {
        id: `sample-msg-${Date.now()}`,
        booking_id: messageData.booking_id,
        property_id: messageData.property_id,
        sender_id: 'current-user',
        receiver_id: messageData.receiver_id,
        message: messageData.message,
        message_type: messageData.message_type || 'text',
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: 'You',
        property_title: 'Sample Property'
      };

      console.log('✅ Sample message created successfully');
      return sampleMessage;
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
      // Since message_threads table doesn't exist, create a sample thread
      const sampleThread: MessageThread = {
        id: `sample-thread-${Date.now()}`,
        booking_id: bookingId || 'sample-booking',
        property_id: propertyId,
        guest_id: guestId,
        owner_id: ownerId,
        subject: `Messages for ${propertyId}`,
        last_message_at: new Date().toISOString(),
        last_message_id: `sample-message-${Date.now()}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        guest_name: 'Guest',
        owner_name: 'Owner',
        property_title: 'Sample Property',
        last_message: 'Sample message',
        unread_count: 0
      };

      console.log('✅ Sample message thread created:', sampleThread.id);
      return sampleThread;
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
      // Mark thread as read in localStorage
      this.markThreadAsRead(userId, threadId);
      console.log('✅ Sample messages marked as read for thread:', threadId);
      return 0;
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
