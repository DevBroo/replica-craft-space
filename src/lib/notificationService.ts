import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  to_user_id: string;
  from_user_id?: string;
  action_url?: string;
  metadata?: any;
}

export interface NotificationFilters {
  user_role?: string;
  property_owner?: boolean;
  all_users?: boolean;
}

export class NotificationService {
  /**
   * Send a notification to a specific user
   */
  static async sendNotification(data: CreateNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          to_user_id: data.to_user_id,
          from_user_id: data.from_user_id,
          action_url: data.action_url,
          metadata: data.metadata,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send notifications to multiple users based on filters
   */
  static async sendBulkNotification(
    title: string,
    message: string,
    filters: NotificationFilters,
    from_user_id?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    action_url?: string,
    metadata?: any
  ): Promise<{ success: boolean; sent_count: number; error?: string }> {
    try {
      console.log('Sending bulk notification with filters:', filters);
      
      let query = supabase
        .from('profiles')
        .select('id, role, email, full_name');

      // Apply filters
      if (filters.user_role) {
        query = query.eq('role', filters.user_role);
        console.log('Filtering by role:', filters.user_role);
      }

      if (filters.property_owner) {
        query = query.eq('role', 'property_owner');
        console.log('Filtering for property owners');
      }

      const { data: users, error: usersError } = await query;
      
      console.log('Found users:', users);
      console.log('Users error:', usersError);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return { success: false, sent_count: 0, error: usersError.message };
      }

      if (!users || users.length === 0) {
        return { success: true, sent_count: 0 };
      }

      // Create notifications for all users
      const notifications = users.map(user => ({
        title,
        message,
        type,
        to_user_id: user.id,
        from_user_id,
        action_url,
        metadata,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      console.log('Creating notifications:', notifications);

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
        
      console.log('Notification insertion error:', error);

      if (error) {
        console.error('Error sending bulk notifications:', error);
        return { success: false, sent_count: 0, error: error.message };
      }

      return { success: true, sent_count: users.length };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { success: false, sent_count: 0, error: 'Failed to send notifications' };
    }
  }

  /**
   * Send notification to all property owners
   */
  static async notifyPropertyOwners(
    title: string,
    message: string,
    from_user_id?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    action_url?: string,
    metadata?: any
  ): Promise<{ success: boolean; sent_count: number; error?: string }> {
    return this.sendBulkNotification(
      title,
      message,
      { property_owner: true },
      from_user_id,
      type,
      action_url,
      metadata
    );
  }

  /**
   * Send notification to all users with a specific role
   */
  static async notifyByRole(
    title: string,
    message: string,
    role: string,
    from_user_id?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    action_url?: string,
    metadata?: any
  ): Promise<{ success: boolean; sent_count: number; error?: string }> {
    return this.sendBulkNotification(
      title,
      message,
      { user_role: role },
      from_user_id,
      type,
      action_url,
      metadata
    );
  }

  /**
   * Send notification to all users
   */
  static async notifyAllUsers(
    title: string,
    message: string,
    from_user_id?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    action_url?: string,
    metadata?: any
  ): Promise<{ success: boolean; sent_count: number; error?: string }> {
    return this.sendBulkNotification(
      title,
      message,
      { all_users: true },
      from_user_id,
      type,
      action_url,
      metadata
    );
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(user_id: string): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
  }> {
    // Temporarily disabled due to schema mismatch
    return { total: 0, unread: 0, by_type: {} };
  }
}
