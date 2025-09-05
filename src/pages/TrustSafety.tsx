import { Shield, CheckCircle, AlertTriangle, Eye, Lock, Users, FileText, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrustSafety = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trust & Safety</h1>
          <p className="text-xl opacity-90">Building a secure and trusted community for everyone</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Our Commitment */}
        <section className="mb-20 text-center">
          <h2 className="text-3xl font-bold mb-8">Our Safety Commitment</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            At Picnify, trust and safety are fundamental to our mission. We're committed to creating a secure platform 
            where property owners and guests can connect with confidence.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Properties</h3>
              <p className="text-muted-foreground">Every property is verified through our comprehensive review process</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Identity Verification</h3>
              <p className="text-muted-foreground">All users undergo identity verification to ensure authentic interactions</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-muted-foreground">All transactions are protected by bank-level security and encryption</p>
            </div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Security Measures</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Shield className="w-6 h-6 text-primary mr-3" />
                Platform Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Advanced Encryption</h4>
                    <p className="text-sm text-muted-foreground">End-to-end encryption for all sensitive data transmission</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Fraud Detection</h4>
                    <p className="text-sm text-muted-foreground">AI-powered systems monitor for suspicious activities 24/7</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Regular Security Audits</h4>
                    <p className="text-sm text-muted-foreground">Third-party security assessments and penetration testing</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Secure Data Storage</h4>
                    <p className="text-sm text-muted-foreground">ISO 27001 compliant data centers with backup systems</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Users className="w-6 h-6 text-primary mr-3" />
                User Verification
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Government ID Verification</h4>
                    <p className="text-sm text-muted-foreground">Mandatory ID verification for all property owners and guests</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Phone Number Verification</h4>
                    <p className="text-sm text-muted-foreground">SMS verification ensures authentic contact information</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Property Documentation</h4>
                    <p className="text-sm text-muted-foreground">Ownership proof and legal documentation verification</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Background Checks</h4>
                    <p className="text-sm text-muted-foreground">Enhanced screening for high-value properties</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Standards */}
        <section id="community" className="mb-20 bg-muted/30 rounded-2xl p-12 scroll-mt-24">
          <h2 className="text-3xl font-bold mb-8 text-center">Community Standards</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">What We Expect</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  Treat all community members with respect and kindness
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  Provide accurate information in listings and profiles
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  Communicate honestly and transparently
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  Follow local laws and regulations
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  Respect property and community guidelines
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Zero Tolerance Policy</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  Discrimination based on race, religion, gender, or nationality
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  Harassment, threats, or inappropriate behavior
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  Fraudulent activities or identity misrepresentation
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  Illegal activities or violations of local laws
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-3 mt-1 flex-shrink-0" />
                  Spam, scams, or unauthorized commercial activities
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Reporting System */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Reporting & Response</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border rounded-lg">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Easy Reporting</h3>
              <p className="text-muted-foreground mb-4">Report safety concerns or inappropriate behavior with one click</p>
              <Link 
                to="/contact#contact-form" 
                className="text-primary font-semibold hover:underline"
                aria-label="Report an issue via contact form"
              >
                Report an Issue →
              </Link>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Quick Investigation</h3>
              <p className="text-muted-foreground mb-4">Our safety team reviews all reports within 24 hours</p>
              <p className="text-sm text-muted-foreground">Average response time: 4 hours</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Protective Action</h3>
              <p className="text-muted-foreground mb-4">Immediate action taken to protect community members</p>
              <p className="text-sm text-muted-foreground">Suspension, removal, or legal action when necessary</p>
            </div>
          </div>
        </section>

        {/* Insurance & Protection */}
        <section className="mb-20 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Insurance & Protection</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">For Property Owners</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Property damage protection up to ₹10 lakhs</li>
                <li>• Liability coverage for guest injuries</li>
                <li>• Income protection for verified damages</li>
                <li>• 24/7 claims support and assistance</li>
                <li>• Host guarantee program coverage</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">For Guests</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Booking protection guarantee</li>
                <li>• Emergency accommodation assistance</li>
                <li>• Secure payment processing</li>
                <li>• Dispute resolution support</li>
                <li>• Travel disruption coverage</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Emergency Support */}
        <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Emergency Support</h2>
          <p className="text-muted-foreground mb-8">
            For immediate safety concerns or emergencies, contact us right away
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Phone className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Emergency Hotline</h3>
              <p className="text-lg font-bold text-red-600">1800-EMERGENCY</p>
              <p className="text-sm text-muted-foreground">Available 24/7</p>
            </div>
            
            <div className="text-center">
              <Shield className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Safety Team</h3>
              <p className="font-semibold">safety@picnify.com</p>
              <p className="text-sm text-muted-foreground">Priority response</p>
            </div>
            
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Local Authorities</h3>
              <p className="font-semibold">Police: 100 | Medical: 102</p>
              <p className="text-sm text-muted-foreground">For immediate emergencies</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TrustSafety;