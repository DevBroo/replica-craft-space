-- Create messages system for guest-owner communication
-- This migration creates tables for messaging between guests and property owners

-- Messages table for guest-owner communication
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message threads table to group related messages
CREATE TABLE IF NOT EXISTS public.message_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.properties(owner_id) ON DELETE CASCADE,
    subject TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, property_id, guest_id, owner_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON public.messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_message_threads_booking_id ON public.message_threads(booking_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_property_id ON public.message_threads(property_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_guest_id ON public.message_threads(guest_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_owner_id ON public.message_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message_at ON public.message_threads(last_message_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND (
            -- Guest can message property owner
            (EXISTS (
                SELECT 1 FROM public.bookings b 
                WHERE b.id = booking_id 
                AND b.user_id = sender_id 
                AND b.property_id = messages.property_id
            )) OR
            -- Property owner can message guest who booked their property
            (EXISTS (
                SELECT 1 FROM public.properties p 
                WHERE p.id = messages.property_id 
                AND p.owner_id = sender_id
            ))
        )
    );

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Create RLS policies for message threads
CREATE POLICY "Users can view threads they participate in" ON public.message_threads
    FOR SELECT USING (
        auth.uid() = guest_id OR auth.uid() = owner_id
    );

CREATE POLICY "Users can create threads for their bookings" ON public.message_threads
    FOR INSERT WITH CHECK (
        auth.uid() = guest_id AND (
            EXISTS (
                SELECT 1 FROM public.bookings b 
                WHERE b.id = booking_id 
                AND b.user_id = guest_id 
                AND b.property_id = message_threads.property_id
            )
        )
    );

CREATE POLICY "Property owners can create threads for their properties" ON public.message_threads
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND (
            EXISTS (
                SELECT 1 FROM public.properties p 
                WHERE p.id = property_id 
                AND p.owner_id = owner_id
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_message_updated_at();

CREATE TRIGGER update_message_threads_updated_at
    BEFORE UPDATE ON public.message_threads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_message_updated_at();

-- Create function to update thread's last message
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.message_threads 
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        updated_at = NOW()
    WHERE 
        booking_id = NEW.booking_id 
        AND property_id = NEW.property_id
        AND ((guest_id = NEW.sender_id AND owner_id = NEW.receiver_id) OR 
             (guest_id = NEW.receiver_id AND owner_id = NEW.sender_id));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update thread when new message is added
CREATE TRIGGER update_thread_on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_thread_last_message();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
    thread_id UUID,
    user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.messages 
    SET 
        is_read = TRUE,
        read_at = NOW()
    WHERE 
        id IN (
            SELECT m.id 
            FROM public.messages m
            JOIN public.message_threads mt ON (
                m.booking_id = mt.booking_id 
                AND m.property_id = mt.property_id
            )
            WHERE mt.id = thread_id 
            AND m.receiver_id = user_id 
            AND m.is_read = FALSE
        );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_threads TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO authenticated;
