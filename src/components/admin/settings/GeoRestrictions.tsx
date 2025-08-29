
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Badge } from '@/components/admin/ui/badge';
import { toast } from 'sonner';
import { Globe, Plus, AlertTriangle } from 'lucide-react';

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
  const [newRule, setNewRule] = useState({
    country_code: '',
    rule_type: 'block' as 'allow' | 'block',
    role: '',
    description: ''
  });

  const addGeoRule = async () => {
    if (!newRule.country_code || !newRule.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.info('Geographic restrictions functionality will be available once the database types are updated');
    
    setNewRule({
      country_code: '',
      rule_type: 'block',
      role: '',
      description: ''
    });
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
        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Geographic restrictions are being configured. Setup interface ready for testing.
          </span>
        </div>

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

        {/* Sample Rules Display */}
        <div className="space-y-4">
          <h4 className="font-medium">Geographic Rules (Sample)</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">ALLOW</Badge>
                    <span className="font-medium">India</span>
                    <Badge variant="outline" className="capitalize">All Roles</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Allow all users from India
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Sample Rule</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
