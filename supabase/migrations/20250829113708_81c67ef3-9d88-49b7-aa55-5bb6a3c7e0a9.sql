-- Enable extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- API integrations table for storing third-party service configs
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL, -- 'twilio', 'resend', 'firebase', etc.
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User notification preferences table
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms', 'push', 'in_app'
  category TEXT NOT NULL, -- 'booking', 'payment', 'security', etc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel, category)
);

-- Notification schedules table for future sends
CREATE TABLE public.notification_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.notification_templates(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]', -- array of recipient objects
  delivery_methods JSONB NOT NULL DEFAULT '[]', -- array of delivery methods
  variables JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Notification events table for tracking opens, clicks, etc.
CREATE TABLE public.notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID REFERENCES public.notification_deliveries(id),
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_integrations
CREATE POLICY "Admins can manage API integrations" ON public.api_integrations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences" ON public.user_notification_preferences
  FOR SELECT USING (is_admin());

-- RLS Policies for notification_schedules
CREATE POLICY "Admins can manage notification schedules" ON public.notification_schedules
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for notification_events
CREATE POLICY "Admins can view notification events" ON public.notification_events
  FOR SELECT USING (is_admin());

CREATE POLICY "System can insert notification events" ON public.notification_events
  FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add template variables support to existing notification_templates
ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';
ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'custom';

-- Update existing notification_deliveries table structure
ALTER TABLE public.notification_deliveries ADD COLUMN IF NOT EXISTS tracking_pixel_id UUID DEFAULT gen_random_uuid();

-- Function to process scheduled notifications
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schedule_record RECORD;
BEGIN
  -- Get pending schedules that are due
  FOR schedule_record IN 
    SELECT * FROM public.notification_schedules 
    WHERE status = 'pending' 
    AND scheduled_for <= now()
    LIMIT 100
  LOOP
    BEGIN
      -- Call the notifications-dispatch function
      PERFORM net.http_post(
        url := 'https://riqsgtuzccwpplbodwbd.supabase.co/functions/v1/notifications-dispatch',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                   current_setting('app.service_role_key', true) || '"}'::jsonb,
        body := jsonb_build_object(
          'recipients', schedule_record.recipients,
          'delivery_methods', schedule_record.delivery_methods,
          'template_id', schedule_record.template_id,
          'variables', schedule_record.variables,
          'scheduled_id', schedule_record.id
        )
      );
      
      -- Mark as sent
      UPDATE public.notification_schedules 
      SET status = 'sent', sent_at = now()
      WHERE id = schedule_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed
      UPDATE public.notification_schedules 
      SET status = 'failed', error_message = SQLERRM
      WHERE id = schedule_record.id;
    END;
  END LOOP;
END;
$$;

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'process-scheduled-notifications',
  '* * * * *',
  'SELECT public.process_scheduled_notifications();'
);