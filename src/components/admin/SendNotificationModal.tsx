
import React, { useState } from 'react';
import { X, Send, Mail, MessageSquare, Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyOwner } from '@/lib/adminService';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: PropertyOwner;
  onSent: () => void;
}

type NotificationType = 'email' | 'sms' | 'in-app';

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  owner,
  onSent
}) => {
  const [notificationType, setNotificationType] = useState<NotificationType>('in-app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [sending, setSending] = useState(false);

  const predefinedMessages = [
    {
      title: 'GST Number Required',
      message: 'Dear {{ownerName}}, please update your GST number to complete your profile verification. This is required for processing payments.'
    },
    {
      title: 'Property Approval Reminder',
      message: 'Hi {{ownerName}}, your property submission is under review. Please ensure all required documents are uploaded for faster approval.'
    },
    {
      title: 'Document Upload Required',
      message: 'Hello {{ownerName}}, we need you to upload the following documents: PAN Card, Aadhar Card. Please complete your profile to avoid delays.'
    },
    {
      title: 'Commission Payment Update',
      message: 'Dear {{ownerName}}, your commission payment for this month has been processed. Please check your bank account for the deposit.'
    },
    {
      title: 'Profile Incomplete',
      message: 'Hi {{ownerName}}, your profile is incomplete. Please add your bank details and business information to start receiving bookings.'
    }
  ];

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please enter both title and message');
      return;
    }

    setSending(true);
    try {
      // Replace placeholders in message
      const personalizedMessage = message.replace(/{{ownerName}}/g, owner.full_name || owner.email || 'Owner');

      // Create notification record
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          target_user_id: owner.id,
          title,
          content: personalizedMessage,
          type: notificationType === 'in-app' ? 'info' : notificationType,
          priority,
          status: 'unread',
          target_audience: null,
          related_entity_type: 'owner',
          related_entity_id: owner.id
        });

      if (notificationError) throw notificationError;

      // Log activity
      await supabase.rpc('log_owner_activity_fn', {
        p_owner_id: owner.id,
        p_action: 'notification_sent',
        p_actor_id: (await supabase.auth.getUser()).data.user?.id,
        p_actor_type: 'admin',
        p_metadata: {
          notification_type: notificationType,
          title,
          priority
        }
      });

      // TODO: For email and SMS, integrate with actual email/SMS service
      if (notificationType === 'email') {
        console.log('Email would be sent to:', owner.email);
        // Integrate with email service (SendGrid, AWS SES, etc.)
      } else if (notificationType === 'sms') {
        console.log('SMS would be sent to:', owner.phone);
        // Integrate with SMS service (Twilio, AWS SNS, etc.)
      }

      alert(`${notificationType.toUpperCase()} notification sent successfully!`);
      onSent();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setPriority('normal');
    setNotificationType('in-app');
  };

  const usePredefinedMessage = (predefined: typeof predefinedMessages[0]) => {
    setTitle(predefined.title);
    setMessage(predefined.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Send Notification</h3>
            <p className="text-sm text-gray-500 mt-1">
              To: {owner.full_name || owner.email} • {owner.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notification Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setNotificationType('in-app')}
                  className={`flex flex-col items-center p-4 border rounded-lg transition-colors ${
                    notificationType === 'in-app'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">In-App</span>
                </button>
                <button
                  onClick={() => setNotificationType('email')}
                  className={`flex flex-col items-center p-4 border rounded-lg transition-colors ${
                    notificationType === 'email'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Mail className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button
                  onClick={() => setNotificationType('sms')}
                  className={`flex flex-col items-center p-4 border rounded-lg transition-colors ${
                    notificationType === 'sms'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">SMS</span>
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Predefined Messages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {predefinedMessages.map((predefined, index) => (
                  <button
                    key={index}
                    onClick={() => usePredefinedMessage(predefined)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-800">{predefined.title}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{predefined.message}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message here...

You can use {{ownerName}} to personalize the message with the owner's name."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use <code>{{ownerName}}</code> to automatically insert the owner's name
              </p>
            </div>

            {/* Preview */}
            {(title || message) && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div className="bg-white border rounded-lg p-3">
                  <p className="font-medium text-gray-800">{title}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {message.replace(/{{ownerName}}/g, owner.full_name || owner.email || 'Owner')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send {notificationType.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationModal;
