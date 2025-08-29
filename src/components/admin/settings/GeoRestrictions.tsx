import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { Globe, Shield, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface GeoRule {
  id: string;
  country_code: string;
  rule_type: 'allow' | 'block';
  role?: string;
  is_active: boolean;
  description?: string;
  created_at: string;
}

export const GeoRestrictions: React.FC = () => {
  const [rules, setRules] = useState<GeoRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    country_code: '',
    rule_type: 'allow' as 'allow' | 'block',
    role: '',
    description: ''
  });

  useEffect(() => {
    loadGeoRules();
  }, []);

  const loadGeoRules = async () => {
    try {
      const { data, error } = await supabase
        .from('security_geo_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []).map(rule => ({
        ...rule,
        rule_type: rule.rule_type as 'allow' | 'block'
      })));
    } catch (error) {
      console.error('Error loading geo rules:', error);
      toast.error('Failed to load geographic rules');
    } finally {
      setLoading(false);
    }
  };

  const addGeoRule = async () => {
    if (!newRule.country_code || !newRule.rule_type) {
      toast.error('Country and rule type are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .insert({
          country_code: newRule.country_code,
          rule_type: newRule.rule_type,
          role: newRule.role || null,
          description: newRule.description || null
        });

      if (error) throw error;

      toast.success('Geographic rule added successfully');
      setNewRule({ country_code: '', rule_type: 'allow', role: '', description: '' });
      loadGeoRules();
    } catch (error) {
      console.error('Error adding geo rule:', error);
      toast.error('Failed to add geographic rule');
    }
  };

  const deleteGeoRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast.success('Geographic rule deleted successfully');
      loadGeoRules();
    } catch (error) {
      console.error('Error deleting geo rule:', error);
      toast.error('Failed to delete geographic rule');
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('security_geo_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast.success('Rule status updated successfully');
      loadGeoRules();
    } catch (error) {
      console.error('Error updating rule status:', error);
      toast.error('Failed to update rule status');
    }
  };

  const getCountryName = (code: string) => {
    const country = COMMON_COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

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
                  <SelectItem value="allow">Allow Access</SelectItem>
                  <SelectItem value="block">Block Access</SelectItem>
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

        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Active Geographic Rules</h4>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                No geographic restrictions configured.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={rule.rule_type === 'allow' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {rule.rule_type}
                    </Badge>
                    <span className="font-medium">{getCountryName(rule.country_code)}</span>
                    {rule.role && (
                      <Badge variant="outline" className="text-xs">
                        {rule.role}
                      </Badge>
                    )}
                    {!rule.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                    >
                      {rule.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteGeoRule(rule.id)}
                      className="text-destructive hover:text-destructive"
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