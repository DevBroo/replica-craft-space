import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Switch } from '@/components/admin/ui/switch';
import { Badge } from '@/components/admin/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Globe, Plus, Trash2, Shield } from 'lucide-react';

interface GeoRule {
  id: string;
  is_active: boolean;
  rule_type: 'allow' | 'block';
  country_code: string;
  role: string | null;
  user_id: string | null;
  description: string | null;
  created_at: string;
}

const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CN', name: 'China' },
];

export const GeoRestrictions: React.FC = () => {
  const [rules, setRules] = useState<GeoRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    country_code: '',
    rule_type: 'block' as 'allow' | 'block',
    role: '',
    description: ''
  });

  useEffect(() => {
    loadGeoRules();
  }, []);

  const loadGeoRules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('security_geo_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRules(data || []);
    } catch (error) {
      console.error('Error loading geo rules:', error);
      toast.error('Failed to load geo restrictions');
    } finally {
      setLoading(false);
    }
  };

  const addGeoRule = async () => {
    if (!newRule.country_code || !newRule.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .insert({
          country_code: newRule.country_code,
          rule_type: newRule.rule_type,
          role: newRule.role || null,
          description: newRule.description
        });

      if (error) throw error;

      toast.success('Geo restriction rule added');
      setNewRule({
        country_code: '',
        rule_type: 'block',
        role: '',
        description: ''
      });
      loadGeoRules();
    } catch (error) {
      console.error('Error adding geo rule:', error);
      toast.error('Failed to add geo restriction rule');
    }
  };

  const toggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Rule ${isActive ? 'activated' : 'deactivated'}`);
      loadGeoRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Rule deleted');
      loadGeoRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const getCountryName = (code: string) => {
    const country = COMMON_COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Geographic Restrictions
          </CardTitle>
          <CardDescription>Control access based on user location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Geographic Restrictions
        </CardTitle>
        <CardDescription>
          Control platform access based on user geographic location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Rule */}
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
          <h4 className="font-medium">Add New Geographic Rule</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={newRule.country_code}
                onValueChange={(value) => setNewRule({ ...newRule, country_code: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_COUNTRIES.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_type">Action</Label>
              <Select
                value={newRule.rule_type}
                onValueChange={(value: 'allow' | 'block') => setNewRule({ ...newRule, rule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block Access</SelectItem>
                  <SelectItem value="allow">Allow Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Target Role (Optional)</Label>
              <Select
                value={newRule.role}
                onValueChange={(value) => setNewRule({ ...newRule, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Rule description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addGeoRule} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Existing Rules */}
        <div className="space-y-4">
          <h4 className="font-medium">Active Geographic Rules</h4>
          
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No geographic restrictions configured
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={rule.rule_type === 'block' ? 'destructive' : 'default'}>
                          {rule.rule_type === 'block' ? 'BLOCK' : 'ALLOW'}
                        </Badge>
                        <span className="font-medium">
                          {getCountryName(rule.country_code)}
                        </span>
                        {rule.role && (
                          <Badge variant="outline" className="capitalize">
                            {rule.role}
                          </Badge>
                        )}
                      </div>
                      {rule.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {rule.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
