-- Create homepage_banners table
CREATE TABLE public.homepage_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  position TEXT NOT NULL CHECK (position IN ('hero', 'secondary', 'footer')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'scheduled')),
  start_date DATE,
  end_date DATE,
  cta_text TEXT,
  cta_link TEXT,
  background_image TEXT,
  target_audience TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal_documents table
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy', 'faq', 'policy')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage_banners (public can view active banners, admins can manage all)
CREATE POLICY "Public can view active banners" 
ON public.homepage_banners 
FOR SELECT 
USING (
  status = 'active' OR 
  (status = 'scheduled' AND start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date >= CURRENT_DATE))
);

CREATE POLICY "Admins can manage all banners" 
ON public.homepage_banners 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for legal_documents (public can view published docs, admins can manage all)
CREATE POLICY "Public can view published documents" 
ON public.legal_documents 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can manage all documents" 
ON public.legal_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_homepage_banners_updated_at
  BEFORE UPDATE ON public.homepage_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample banner data
INSERT INTO public.homepage_banners (title, subtitle, position, status, cta_text, cta_link, background_image, target_audience) VALUES
('Welcome to Picnify', 'Discover perfect getaways near you', 'hero', 'active', 'Start Exploring', '/properties', '/lovable-uploads/hero-background.jpg', 'all_users'),
('Special Weekend Offers', 'Book now and save up to 30%', 'secondary', 'active', 'View Offers', '/properties?filter=offers', null, 'weekend_travelers');

-- Insert some sample legal document data  
INSERT INTO public.legal_documents (title, content, document_type, status) VALUES
('Terms of Service', 'Complete terms of service content...', 'terms', 'published'),
('Privacy Policy', 'Complete privacy policy content...', 'privacy', 'published'),
('Frequently Asked Questions', 'Common questions and answers...', 'faq', 'published');