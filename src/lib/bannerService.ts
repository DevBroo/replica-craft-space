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
    return data || [];
  },

  async getAllBanners(): Promise<HomepageBanner[]> {
    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createBanner(banner: Omit<HomepageBanner, 'id' | 'created_at' | 'updated_at'>): Promise<HomepageBanner> {
    const { data, error } = await supabase
      .from('homepage_banners')
      .insert([banner])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBanner(id: string, updates: Partial<HomepageBanner>): Promise<HomepageBanner> {
    const { data, error } = await supabase
      .from('homepage_banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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