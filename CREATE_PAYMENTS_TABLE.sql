-- Manual SQL script to create payments table
-- Run this in your Supabase SQL editor if the payments table doesn't exist

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert payments" ON public.payments
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE 
    USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO anon;
