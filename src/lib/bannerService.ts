import { supabase } from "@/integrations/supabase/client";

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  position: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  background_image?: string | null;
  target_audience?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

// Field mapping utilities
const mapToDatabase = (data: any) => {
  const mapped: any = { ...data };
  
  // Map camelCase to snake_case for database
  if (data.backgroundImage !== undefined) {
    mapped.background_image = data.backgroundImage;
    delete mapped.backgroundImage;
  }
  if (data.startDate !== undefined) {
    mapped.start_date = data.startDate;
    delete mapped.startDate;
  }
  if (data.endDate !== undefined) {
    mapped.end_date = data.endDate;
    delete mapped.endDate;
  }
  if (data.ctaText !== undefined) {
    mapped.cta_text = data.ctaText;
    delete mapped.ctaText;
  }
  if (data.ctaLink !== undefined) {
    mapped.cta_link = data.ctaLink;
    delete mapped.ctaLink;
  }
  if (data.targetAudience !== undefined) {
    mapped.target_audience = data.targetAudience;
    delete mapped.targetAudience;
  }
  
  return mapped;
};

const mapFromDatabase = (data: any) => {
  if (!data) return data;
  
  const mapped: any = { ...data };
  
  // Map snake_case to camelCase for frontend
  if (data.background_image !== undefined) {
    mapped.backgroundImage = data.background_image;
  }
  if (data.start_date !== undefined) {
    mapped.startDate = data.start_date;
  }
  if (data.end_date !== undefined) {
    mapped.endDate = data.end_date;
  }
  if (data.cta_text !== undefined) {
    mapped.ctaText = data.cta_text;
  }
  if (data.cta_link !== undefined) {
    mapped.ctaLink = data.cta_link;
  }
  if (data.target_audience !== undefined) {
    mapped.targetAudience = data.target_audience;
  }
  
  return mapped;
};

export const bannerService = {
  // Banner operations
  async getBannersByPosition(position: string): Promise<HomepageBanner[]> {
    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .eq('position', position)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(mapFromDatabase) || [];
  },

  async getAllBanners(): Promise<HomepageBanner[]> {
    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(mapFromDatabase) || [];
  },

  async createBanner(banner: Omit<HomepageBanner, 'id' | 'created_at' | 'updated_at'>): Promise<HomepageBanner> {
    const mappedBanner = mapToDatabase(banner);
    const { data, error } = await supabase
      .from('homepage_banners')
      .insert([mappedBanner])
      .select()
      .single();

    if (error) throw error;
    return mapFromDatabase(data);
  },

  async updateBanner(id: string, updates: Partial<HomepageBanner>): Promise<HomepageBanner> {
    const mappedUpdates = mapToDatabase(updates);
    const { data, error } = await supabase
      .from('homepage_banners')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFromDatabase(data);
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('homepage_banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Legal document operations
  async getAllLegalDocuments(): Promise<LegalDocument[]> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createLegalDocument(document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .insert([document])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLegalDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLegalDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};