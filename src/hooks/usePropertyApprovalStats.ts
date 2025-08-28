
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyApprovalStats {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  avg_pending_hours: number;
}

export function usePropertyApprovalStats() {
  const [stats, setStats] = useState<PropertyApprovalStats>({
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
    avg_pending_hours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching property approval stats using RPC function...');
        
        // Use the RPC function for property approval stats
        const { data, error } = await supabase.rpc('get_property_approval_stats');
        
        if (error) {
          console.error('❌ RPC error:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('✅ Stats fetched successfully:', data[0]);
          setStats(data[0]);
        } else {
          console.log('ℹ️ No stats data returned, using zeros');
          setStats({
            total_pending: 0,
            total_approved: 0,
            total_rejected: 0,
            avg_pending_hours: 0,
          });
        }
      } catch (err) {
        console.error('❌ Error fetching approval stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        
        // Fallback to manual calculation if RPC fails
        try {
          console.log('🔄 Attempting fallback calculation...');
          const { data: properties } = await supabase
            .from('properties')
            .select('status, created_at');
          
          if (properties) {
            const pending = properties.filter(p => p.status === 'pending').length;
            const approved = properties.filter(p => p.status === 'approved').length;
            const rejected = properties.filter(p => p.status === 'rejected').length;
            
            console.log('✅ Fallback stats calculated:', { pending, approved, rejected });
            
            setStats({
              total_pending: pending,
              total_approved: approved,
              total_rejected: rejected,
              avg_pending_hours: 0, // Can't calculate without status history
            });
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback calculation also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}
