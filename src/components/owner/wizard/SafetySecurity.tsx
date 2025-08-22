import React from 'react';
import { PropertyFormData } from '../PropertyWizard';
import { Button } from '@/components/owner/ui/button';
import { Label } from '@/components/owner/ui/label';
import { Textarea } from '@/components/owner/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/owner/ui/card';
import { Badge } from '@/components/owner/ui/badge';
import { Checkbox } from '@/components/owner/ui/checkbox';
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, Camera, Lock } from 'lucide-react';

interface SafetySecurityProps {
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const FIRE_SAFETY_FEATURES = [
  'Smoke Alarms', 'Fire Extinguishers', 'Fire Blankets', 'Sprinkler System',
  'Emergency Exit Signs', 'Fire Escape Routes', 'Fire Doors', 'Emergency Lighting',
  'Fire Assembly Point', 'Staff Fire Training', 'Regular Fire Drills', 'Fire Safety Certificate'
];

const SECURITY_FEATURES = [
  'CCTV Surveillance', '24-hour Security', 'Access Control System', 'Security Guards',
  'Electronic Key Cards', 'Safe Deposit Boxes', 'In-room Safes', 'Security Lighting',
  'Perimeter Fencing', 'Visitor Registration', 'Emergency Alarm System', 'Panic Buttons',
  'Security Patrol', 'Biometric Access', 'Motion Sensors', 'Security Escort Service'
];

const HEALTH_SAFETY_FEATURES = [
  'First Aid Kit', 'First Aid Trained Staff', 'Medical Emergency Procedures',
  'Emergency Contact List', 'AED (Defibrillator)', 'Wheelchair Accessibility',
  'Non-slip Surfaces', 'Handrails & Grab Bars', 'Emergency Phone System',
  'Regular Safety Inspections', 'COVID-19 Safety Protocols', 'Sanitization Stations',
  'Air Quality Monitoring', 'Water Quality Testing', 'Pest Control Services'
];

const EMERGENCY_PROCEDURES = [
  'Fire Evacuation Plan', 'Medical Emergency Response', 'Natural Disaster Protocol',
  'Security Incident Response', 'Power Outage Procedures', 'Water Emergency Protocol',
  'Guest Emergency Contacts', 'Local Emergency Services Info', 'Staff Emergency Training',
  'Emergency Supply Kit', 'Communication System', 'Backup Generator'
];

const SafetySecurity: React.FC<SafetySecurityProps> = ({
  formData,
  setFormData,
  onNext,
  onPrevious
}) => {
  const handleSafetyFeatureToggle = (category: keyof typeof formData.safety_security, feature: string) => {
    setFormData(prev => ({
      ...prev,
      safety_security: {
        ...prev.safety_security,
        [category]: prev.safety_security[category].includes(feature)
          ? prev.safety_security[category].filter(f => f !== feature)
          : [...prev.safety_security[category], feature]
      }
    }));
  };

  const totalSafetyFeatures = Object.values(formData.safety_security).reduce(
    (total, features) => total + features.length, 0
  );

  return (
    <div className="space-y-6">
      {/* Safety Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Safety & Security Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive safety and security features build trust with guests and ensure compliance with regulations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.safety_security.fire_safety.length}
              </div>
              <div className="text-sm text-muted-foreground">Fire Safety</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.safety_security.security_features.length}
              </div>
              <div className="text-sm text-muted-foreground">Security</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.safety_security.health_safety.length}
              </div>
              <div className="text-sm text-muted-foreground">Health & Safety</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formData.safety_security.emergency_procedures.length}
              </div>
              <div className="text-sm text-muted-foreground">Emergency Plans</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              Safety Score: {totalSafetyFeatures}/48 features
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {totalSafetyFeatures >= 20 ? 'Excellent safety standards' :
               totalSafetyFeatures >= 10 ? 'Good safety coverage' :
               'Consider adding more safety features'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fire Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Fire Safety Features
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Essential fire safety equipment and procedures for guest protection
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FIRE_SAFETY_FEATURES.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`fire-${feature}`}
                  checked={formData.safety_security.fire_safety.includes(feature)}
                  onCheckedChange={() => handleSafetyFeatureToggle('fire_safety', feature)}
                />
                <Label htmlFor={`fire-${feature}`} className="text-sm cursor-pointer">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Lock className="w-5 h-5 mr-2 text-blue-500" />
            Security Features
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Security measures to protect guests and property
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SECURITY_FEATURES.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`security-${feature}`}
                  checked={formData.safety_security.security_features.includes(feature)}
                  onCheckedChange={() => handleSafetyFeatureToggle('security_features', feature)}
                />
                <Label htmlFor={`security-${feature}`} className="text-sm cursor-pointer">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health & Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-500" />
            Health & Safety
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Health protocols and safety measures for guest wellbeing
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {HEALTH_SAFETY_FEATURES.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`health-${feature}`}
                  checked={formData.safety_security.health_safety.includes(feature)}
                  onCheckedChange={() => handleSafetyFeatureToggle('health_safety', feature)}
                />
                <Label htmlFor={`health-${feature}`} className="text-sm cursor-pointer">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Emergency Procedures
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Documented procedures and protocols for various emergency situations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EMERGENCY_PROCEDURES.map(procedure => (
              <div key={procedure} className="flex items-center space-x-2">
                <Checkbox
                  id={`emergency-${procedure}`}
                  checked={formData.safety_security.emergency_procedures.includes(procedure)}
                  onCheckedChange={() => handleSafetyFeatureToggle('emergency_procedures', procedure)}
                />
                <Label htmlFor={`emergency-${procedure}`} className="text-sm cursor-pointer">
                  {procedure}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Safety Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Safety Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Provide any additional safety details, certifications, or special measures
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="safety_certificates">Safety Certificates & Compliance</Label>
            <Textarea
              id="safety_certificates"
              placeholder="List any safety certificates, compliance standards, or regulatory approvals (e.g., Fire Safety Certificate, Tourism Department License, etc.)"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="covid_protocols">COVID-19 Safety Protocols</Label>
            <Textarea
              id="covid_protocols"
              placeholder="Describe your current health and safety protocols related to COVID-19 or other health concerns"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="special_safety_measures">Special Safety Measures</Label>
            <Textarea
              id="special_safety_measures"
              placeholder="Any unique safety features, location-specific safety measures, or additional precautions you take"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Safety Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-yellow-800">Essential Safety Features</div>
              <div className="text-yellow-700 mt-1">
                Smoke alarms, fire extinguishers, and first aid kits are considered essential by most booking platforms and insurance providers.
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">Security Investment</div>
              <div className="text-blue-700 mt-1">
                Properties with CCTV and 24-hour security typically command higher rates and receive better reviews for guest safety.
              </div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800">Documentation</div>
              <div className="text-green-700 mt-1">
                Keep records of safety inspections, staff training, and equipment maintenance for liability protection and insurance claims.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SafetySecurity;