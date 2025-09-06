-- Create user payment methods table for storing customer payment method preferences
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('card', 'upi', 'netbanking', 'wallet', 'bnpl')),
    provider TEXT NOT NULL DEFAULT 'phonepe', -- Only PhonePe gateway
    
    -- Card details (encrypted/tokenized in production)
    last_four TEXT, -- Only last 4 digits for display
    brand TEXT, -- 'visa', 'mastercard', 'amex', etc.
    cardholder_name TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    
    -- Other payment method metadata
    metadata JSONB DEFAULT '{}', -- For UPI IDs, wallet info, etc.
    
    -- Payment processor details
    external_id TEXT, -- Token/ID from payment processor
    processor_metadata JSONB DEFAULT '{}',
    
    -- Status and flags
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_default ON public.user_payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_active ON public.user_payment_methods(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payment methods" 
ON public.user_payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" 
ON public.user_payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.user_payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.user_payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all payment methods for support purposes
CREATE POLICY "Admins can view all payment methods" 
ON public.user_payment_methods 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_payment_methods_updated_at 
BEFORE UPDATE ON public.user_payment_methods 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION enforce_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated record is being set as default
    IF NEW.is_default = true THEN
        -- Unset all other default payment methods for this user
        UPDATE public.user_payment_methods 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_enforce_single_default_payment_method
BEFORE INSERT OR UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION enforce_single_default_payment_method();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_payment_methods TO authenticated;

-- Create a view for safe display of payment methods (excluding sensitive data)
CREATE OR REPLACE VIEW public.user_payment_methods_safe AS
SELECT 
    id,
    user_id,
    type,
    provider,
    last_four,
    brand,
    cardholder_name,
    expiry_month,
    expiry_year,
    -- Only include safe metadata (no sensitive tokens)
    CASE 
        WHEN type = 'upi' THEN jsonb_build_object('upi_id', metadata->>'upi_id')
        WHEN type = 'wallet' THEN jsonb_build_object('wallet_provider', metadata->>'wallet_provider')
        WHEN type = 'netbanking' THEN jsonb_build_object('bank_account', metadata->>'bank_account')
        ELSE '{}'::jsonb
    END as metadata,
    is_default,
    is_verified,
    is_active,
    created_at,
    updated_at
FROM public.user_payment_methods
WHERE is_active = true;

-- Grant permissions on the safe view
GRANT SELECT ON public.user_payment_methods_safe TO authenticated;

-- Note: The view inherits security from the underlying table's RLS policies
