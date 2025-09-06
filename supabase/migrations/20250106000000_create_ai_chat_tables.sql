-- Create AI Chat System Tables

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  metadata JSONB DEFAULT '{}'
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Chat Data Table (for analytics and data collection)
CREATE TABLE IF NOT EXISTS public.chat_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  intents TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '{}',
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  resolution_status TEXT NOT NULL DEFAULT 'unresolved' CHECK (resolution_status IN ('resolved', 'unresolved', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages((metadata->>'session_id'));
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON public.chat_messages(role);

CREATE INDEX IF NOT EXISTS idx_chat_data_session_id ON public.chat_data(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_data_user_id ON public.chat_data(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_data_resolution_status ON public.chat_data(resolution_status);
CREATE INDEX IF NOT EXISTS idx_chat_data_created_at ON public.chat_data(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat sessions"
ON public.chat_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from their sessions"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  (metadata->>'user_id')::uuid = auth.uid() OR
  (metadata->>'session_id') IN (
    SELECT session_id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their sessions"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (metadata->>'user_id')::uuid = auth.uid() OR
  (metadata->>'session_id') IN (
    SELECT session_id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- RLS Policies for chat_data
CREATE POLICY "Users can view their own chat data"
ON public.chat_data
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat data"
ON public.chat_data
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin policies (for analytics and management)
CREATE POLICY "Admins can view all chat data"
ON public.chat_data
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all chat sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_chat_sessions_updated_at 
  BEFORE UPDATE ON public.chat_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_data_updated_at 
  BEFORE UPDATE ON public.chat_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO public.chat_sessions (id, session_id, created_at, status, metadata) 
VALUES 
  ('sample_session_1', 'sample_session_1', now(), 'ended', '{"device_type": "desktop", "page_url": "/help-center"}')
ON CONFLICT (session_id) DO NOTHING;

-- Add some sample chat data for analytics
INSERT INTO public.chat_data (session_id, messages, intents, entities, resolution_status, created_at)
VALUES 
  ('sample_session_1', 
   '[{"id": "msg1", "content": "Hello", "role": "user", "timestamp": "2024-01-01T10:00:00Z"}, {"id": "msg2", "content": "Hi! How can I help you?", "role": "assistant", "timestamp": "2024-01-01T10:00:01Z"}]',
   ARRAY['greeting', 'general'],
   '{"locations": ["bangalore"], "phone_numbers": ["+918012345678"]}',
   'resolved',
   now())
ON CONFLICT DO NOTHING;
