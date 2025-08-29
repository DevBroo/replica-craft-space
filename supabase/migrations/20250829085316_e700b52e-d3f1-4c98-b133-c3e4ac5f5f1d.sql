-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification deliveries table
CREATE TABLE public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  recipient_id UUID,
  recipient_type TEXT NOT NULL, -- 'user', 'agent', 'owner'
  delivery_method TEXT NOT NULL, -- 'email', 'sms', 'push', 'in-app'
  recipient_email TEXT,
  recipient_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id TEXT, -- ID from email/SMS provider
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_templates
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view active templates"
ON public.notification_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create policies for notification_deliveries
CREATE POLICY "Admins can manage notification deliveries"
ON public.notification_deliveries
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own deliveries"
ON public.notification_deliveries
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_notification_deliveries_notification_id ON public.notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_recipient ON public.notification_deliveries(recipient_id, recipient_type);
CREATE INDEX idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX idx_notification_templates_category ON public.notification_templates(category);

-- Insert default templates
INSERT INTO public.notification_templates (name, subject, content, type, category) VALUES
('Booking Confirmation', 'Booking Confirmed - {property_title}', 'Dear {customer_name}, your booking for {property_title} from {check_in_date} to {check_out_date} has been confirmed. Total amount: {total_amount}', 'email', 'booking'),
('Booking Cancellation', 'Booking Cancelled - {property_title}', 'Dear {customer_name}, your booking for {property_title} has been cancelled. Refund amount: {refund_amount}', 'email', 'booking'),
('Payment Confirmation', 'Payment Received - {property_title}', 'Dear {customer_name}, we have received your payment of {amount} for booking {booking_id}', 'email', 'payment'),
('Property Approved', 'Property Listing Approved', 'Dear {owner_name}, your property "{property_title}" has been approved and is now live on our platform.', 'email', 'property'),
('Property Rejected', 'Property Listing Needs Updates', 'Dear {owner_name}, your property "{property_title}" needs some updates before approval. Reason: {reason}', 'email', 'property'),
('Welcome Message', 'Welcome to Picnify!', 'Dear {user_name}, welcome to Picnify! We are excited to have you on board.', 'email', 'general');