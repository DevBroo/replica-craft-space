-- Ensure payments table exists for PhonePe integration
-- This migration ensures the payments table is created if it doesn't exist

-- Create payments table if it doesn't exist
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE id = booking_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
CREATE POLICY "System can insert payments" ON public.payments
    FOR INSERT 
    WITH CHECK (true); -- Allow system to insert payments

DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "System can update payments" ON public.payments
    FOR UPDATE 
    USING (true); -- Allow system to update payment status

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO anon;

-- Create updated_at trigger for payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.payments IS 'Payment records for booking transactions including PhonePe, Razorpay, etc.';
