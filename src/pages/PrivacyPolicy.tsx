import { Shield, Eye, Lock, FileText, Mail, Globe } from 'lucide-react';
import { COMPANY_INFO } from '@/config/company';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90">Protecting your privacy is fundamental to our mission</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Last Updated */}
          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">Last updated: January 2024</p>
            <p className="text-sm">This Privacy Policy describes how Picnify ("we," "our," or "us") collects, uses, and protects your personal information when you use our platform.</p>
          </div>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Eye className="w-6 h-6 text-primary mr-3" />
              Information We Collect
            </h2>
            
            <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
            <ul className="space-y-2 mb-6 text-muted-foreground">
              <li>• Name, email address, and phone number</li>
              <li>• Profile photo and personal preferences</li>
              <li>• Payment information and billing address</li>
              <li>• Government-issued ID for verification purposes</li>
              <li>• Communication history with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">Usage Information</h3>
            <ul className="space-y-2 mb-6 text-muted-foreground">
              <li>• Search queries and booking history</li>
              <li>• Device information and IP address</li>
              <li>• Browser type and operating system</li>
              <li>• Pages visited and time spent on our platform</li>
              <li>• Location data (with your permission)</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="w-6 h-6 text-primary mr-3" />
              How We Use Your Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Service Provision</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Process bookings and payments</li>
                  <li>• Verify user identity and prevent fraud</li>
                  <li>• Provide customer support</li>
                  <li>• Send booking confirmations and updates</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Platform Improvement</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Analyze usage patterns and preferences</li>
                  <li>• Improve search and recommendation algorithms</li>
                  <li>• Develop new features and services</li>
                  <li>• Conduct research and analytics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Globe className="w-6 h-6 text-primary mr-3" />
              Information Sharing
            </h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">We Do Not Sell Your Data</h3>
              <p className="text-muted-foreground">We never sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
            </div>

            <h3 className="text-xl font-semibold mb-4">Limited Sharing Circumstances</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li>• <strong>Hosts:</strong> Necessary booking details to facilitate your stay</li>
              <li>• <strong>Payment Processors:</strong> Secure payment processing (encrypted data only)</li>
              <li>• <strong>Legal Requirements:</strong> When required by law or to protect our users</li>
              <li>• <strong>Service Providers:</strong> Trusted partners who help operate our platform (under strict confidentiality)</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Shield className="w-6 h-6 text-primary mr-3" />
              Data Security
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Technical Safeguards</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• End-to-end encryption for sensitive data</li>
                  <li>• Secure Socket Layer (SSL) technology</li>
                  <li>• Regular security audits and updates</li>
                  <li>• Multi-factor authentication options</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Organizational Measures</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Limited access to personal data</li>
                  <li>• Employee training on data protection</li>
                  <li>• Regular policy reviews and updates</li>
                  <li>• Incident response procedures</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Your Privacy Rights</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Access and Correction</h3>
                <p className="text-muted-foreground text-sm">Request access to your personal data and correct any inaccuracies</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Data Portability</h3>
                <p className="text-muted-foreground text-sm">Receive a copy of your data in a structured, machine-readable format</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Deletion</h3>
                <p className="text-muted-foreground text-sm">Request deletion of your personal data (subject to legal requirements)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Marketing Opt-out</h3>
                <p className="text-muted-foreground text-sm">Unsubscribe from marketing communications at any time</p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-primary/5 rounded-2xl p-8 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Questions About Privacy?</h2>
            <p className="text-muted-foreground mb-6">Contact our Data Protection Officer for any privacy-related inquiries</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> {COMPANY_INFO.email.privacy}</p>
              <p><strong>Address:</strong> {COMPANY_INFO.departments.privacy}, {COMPANY_INFO.address.headquarters}</p>
              <p><strong>Phone:</strong> {COMPANY_INFO.phone.privacy}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;