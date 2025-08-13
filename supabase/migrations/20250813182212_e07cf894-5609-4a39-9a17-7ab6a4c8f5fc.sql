-- Create user_saved_properties table for wishlist functionality
CREATE TABLE public.user_saved_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_saved_properties ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved properties" 
ON public.user_saved_properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own saved properties" 
ON public.user_saved_properties 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved properties" 
ON public.user_saved_properties 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_saved_properties_updated_at
BEFORE UPDATE ON public.user_saved_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_user_saved_properties_user_id ON public.user_saved_properties(user_id);
CREATE INDEX idx_user_saved_properties_property_id ON public.user_saved_properties(property_id);