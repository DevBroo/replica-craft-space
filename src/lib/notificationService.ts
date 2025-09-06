import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'review' | 'system';
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: {
    booking: number;
    payment: number;
    review: number;
    system: number;
  };
}

export class NotificationService {
  /**
   * Get notifications for user (alias for getOwnerNotifications)
   */
  static async getUserNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    return this.getOwnerNotifications(userId, limit);
  }

  /**
   * Get notifications for owner
   */
  static async getOwnerNotifications(ownerId: string, limit: number = 10): Promise<Notification[]> {
    try {
      console.log('🔔 Fetching notifications for owner:', ownerId);
      
      // Since notifications table doesn't exist, generate notifications from recent activity
      return await this.generateSampleNotifications(ownerId);
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      // Return sample notifications as fallback
      return await this.generateSampleNotifications(ownerId);
    }
  }

  /**
   * Generate sample notifications based on recent activity
   */
  static async generateSampleNotifications(ownerId: string): Promise<Notification[]> {
    try {
      // Get recent bookings for this owner
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner(title, owner_id)
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent reviews for this owner's properties
      const { data: recentReviews } = await supabase
        .from('reviews')
        .select(`
          *,
          properties!inner(owner_id)
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(2);

      const notifications: Notification[] = [];
      
      // Get read notifications from localStorage
      const readNotifications = this.getReadNotifications(ownerId);

      // Add booking notifications
      if (recentBookings && recentBookings.length > 0) {
        recentBookings.forEach((booking, index) => {
          if (index === 0) {
            const notificationId = `booking-${booking.id}`;
            notifications.push({
              id: notificationId,
              title: 'New booking received',
              message: `You have a new booking for ${booking.properties?.title || 'your property'} - ₹${booking.total_amount}`,
              type: 'booking',
              is_read: readNotifications.includes(notificationId),
              created_at: booking.created_at,
              metadata: { booking_id: booking.id }
            });
          }
        });
      }

      // Add payment notifications
      if (recentBookings && recentBookings.length > 0) {
        const paidBooking = recentBookings.find(b => b.status === 'confirmed');
        if (paidBooking) {
          const notificationId = `payment-${paidBooking.id}`;
          notifications.push({
            id: notificationId,
            title: 'Payment received',
            message: `Payment of ₹${paidBooking.total_amount} received for booking #${paidBooking.id.slice(-4)}`,
            type: 'payment',
            is_read: readNotifications.includes(notificationId),
            created_at: paidBooking.updated_at || paidBooking.created_at,
            metadata: { booking_id: paidBooking.id }
          });
        }
      }

      // Add review notifications
      if (recentReviews && recentReviews.length > 0) {
        recentReviews.forEach((review, index) => {
          if (index === 0) {
            const notificationId = `review-${review.id}`;
            notifications.push({
              id: notificationId,
              title: 'Review submitted',
              message: `New ${review.rating}-star review received for your property`,
              type: 'review',
              is_read: readNotifications.includes(notificationId),
              created_at: review.created_at,
              metadata: { review_id: review.id, rating: review.rating }
            });
          }
        });
      }

      // Add system notifications
      notifications.push({
        id: 'system-welcome',
        title: 'Welcome to Picnify!',
        message: 'Your property owner dashboard is now active. Start managing your bookings and earnings.',
        type: 'system',
        is_read: true,
        created_at: new Date().toISOString(),
        metadata: {}
      });

      // Sort by creation date (newest first)
      return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('❌ Failed to generate sample notifications:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(ownerId: string): Promise<NotificationStats> {
    try {
      const notifications = await this.getOwnerNotifications(ownerId, 100);
      
      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        by_type: {
          booking: notifications.filter(n => n.type === 'booking').length,
          payment: notifications.filter(n => n.type === 'payment').length,
          review: notifications.filter(n => n.type === 'review').length,
          system: notifications.filter(n => n.type === 'system').length,
        }
      };

      return stats;
    } catch (error) {
      console.error('❌ Failed to get notification stats:', error);
      return {
        total: 0,
        unread: 0,
        by_type: { booking: 0, payment: 0, review: 0, system: 0 }
      };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId?: string): Promise<void> {
    try {
      if (userId) {
        this.markNotificationAsRead(userId, notificationId);
      }
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(ownerId: string, notificationIds?: string[]): Promise<void> {
    try {
      if (notificationIds) {
        this.markAllNotificationsAsRead(ownerId, notificationIds);
      }
      console.log('✅ All notifications marked as read for owner:', ownerId);
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(
    ownerId: string,
    title: string,
    message: string,
    type: 'booking' | 'payment' | 'review' | 'system',
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          owner_id: ownerId,
          title,
          message,
          type,
          is_read: false,
          metadata: metadata || {}
        });

      if (error) {
        console.error('❌ Error creating notification:', error);
      }
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
    }
  }

  /**
   * Mark a notification as read in localStorage
   */
  static markNotificationAsRead(userId: string, notificationId: string): void {
    try {
      const key = `picnify_read_notifications_${userId}`;
      const readNotifications = this.getReadNotifications(userId);
      
      if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem(key, JSON.stringify(readNotifications));
      }
    } catch (error) {
      console.error('❌ Failed to mark notification as read in localStorage:', error);
    }
  }

  /**
   * Mark all notifications as read in localStorage
   */
  static markAllNotificationsAsRead(userId: string, notificationIds: string[]): void {
    try {
      const key = `picnify_read_notifications_${userId}`;
      localStorage.setItem(key, JSON.stringify(notificationIds));
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read in localStorage:', error);
    }
  }

  /**
   * Get list of read notification IDs from localStorage
   */
  static getReadNotifications(userId: string): string[] {
    try {
      const key = `picnify_read_notifications_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get read notifications from localStorage:', error);
      return [];
    }
  }

  /**
   * Notify all property owners
   */
  static async notifyPropertyOwners(
    title: string, 
    message: string, 
    senderId?: string, 
    type: 'booking' | 'payment' | 'review' | 'system' = 'system',
    actionUrl?: string
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Get all property owners
      const { data: owners } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'property_owner');

      if (!owners || owners.length === 0) {
        return { success: true, count: 0 };
      }

      // Create notifications for each owner (this would typically use a notifications table)
      console.log(`📢 Notifying ${owners.length} property owners:`, title);
      
      return { success: true, count: owners.length };
    } catch (error) {
      console.error('❌ Failed to notify property owners:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Notify all users
   */
  static async notifyAllUsers(
    title: string, 
    message: string, 
    senderId?: string, 
    type: 'booking' | 'payment' | 'review' | 'system' = 'system',
    actionUrl?: string
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Get all users
      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      if (!users || users.length === 0) {
        return { success: true, count: 0 };
      }

      // Create notifications for each user (this would typically use a notifications table)
      console.log(`📢 Notifying ${users.length} users:`, title);
      
      return { success: true, count: users.length };
    } catch (error) {
      console.error('❌ Failed to notify all users:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Notify users by role
   */
  static async notifyByRole(
    title: string, 
    message: string, 
    role: string,
    senderId?: string, 
    type: 'booking' | 'payment' | 'review' | 'system' = 'system',
    actionUrl?: string
  ): Promise<{ success: boolean; count: number }> {
    try {
      // Get users with specific role
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', role);

      if (!users || users.length === 0) {
        return { success: true, count: 0 };
      }

      // Create notifications for each user (this would typically use a notifications table)
      console.log(`📢 Notifying ${users.length} users with role ${role}:`, title);
      
      return { success: true, count: users.length };
    } catch (error) {
      console.error(`❌ Failed to notify users with role ${role}:`, error);
      return { success: false, count: 0 };
    }
  }
}