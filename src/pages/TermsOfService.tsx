import { FileText, Scale, AlertCircle, CheckCircle, DollarSign, Users } from 'lucide-react';
import { COMPANY_INFO } from '@/config/company';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-secondary text-secondary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Scale className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl opacity-90">Legal terms and conditions for using Picnify</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Last Updated */}
          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-2">Last updated: January 2024</p>
            <p className="text-sm">By using Picnify, you agree to these Terms of Service. Please read them carefully.</p>
          </div>

          {/* Agreement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="w-6 h-6 text-primary mr-3" />
              Agreement to Terms
            </h2>
            <p className="text-muted-foreground mb-4">
              These Terms of Service ("Terms") govern your use of the Picnify platform, website, and mobile applications (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm"><strong>Important:</strong> If you do not agree to these Terms, please do not use our Service.</p>
            </div>
          </section>

          {/* User Accounts */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Users className="w-6 h-6 text-primary mr-3" />
              User Accounts and Responsibilities
            </h2>
            
            <h3 className="text-xl font-semibold mb-4">Account Registration</h3>
            <ul className="space-y-2 mb-6 text-muted-foreground">
              <li>• You must be at least 18 years old to create an account</li>
              <li>• Provide accurate and complete registration information</li>
              <li>• Maintain the security of your account credentials</li>
              <li>• You are responsible for all activities under your account</li>
              <li>• Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">Prohibited Activities</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Fraudulent or deceptive practices
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Harassment or discrimination
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Violating local laws or regulations
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Unauthorized commercial activities
                </li>
              </ul>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Spamming or unsolicited communications
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Attempting to breach platform security
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Misrepresenting property information
                </li>
                <li className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Circumventing booking fees
                </li>
              </ul>
            </div>
          </section>

          {/* Booking Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <DollarSign className="w-6 h-6 text-primary mr-3" />
              Booking and Payment Terms
            </h2>
            
            <h3 className="text-xl font-semibold mb-4">Booking Process</h3>
            <ul className="space-y-2 mb-6 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                Bookings are confirmed upon payment completion
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                All prices include applicable taxes and fees
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                Availability is subject to real-time confirmation
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                Special requests are not guaranteed
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-4">Cancellation Policy</h3>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Free Cancellation:</strong> Up to 24 hours before check-in</li>
                <li>• <strong>Partial Refund:</strong> 24-48 hours before check-in (50% refund)</li>
                <li>• <strong>No Refund:</strong> Less than 24 hours before check-in</li>
                <li>• <strong>Force Majeure:</strong> Full refund for qualifying events</li>
              </ul>
            </div>
          </section>

          {/* Property Owner Terms */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Property Owner Obligations</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Listing Requirements</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Accurate property descriptions and photos</li>
                  <li>• Current pricing and availability</li>
                  <li>• Compliance with local regulations</li>
                  <li>• Valid permits and licenses</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Guest Services</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Timely response to guest inquiries</li>
                  <li>• Clean and safe accommodations</li>
                  <li>• Honor confirmed bookings</li>
                  <li>• Provide listed amenities</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Liability */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Limitation of Liability</h2>
            
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Platform Liability</h3>
              <p className="text-muted-foreground text-sm">
                Picnify acts as an intermediary platform. We are not responsible for the actions of property owners or guests, property conditions, or incidents that occur during stays.
              </p>
            </div>

            <h3 className="text-xl font-semibold mb-4">User Responsibilities</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Verify property details independently</li>
              <li>• Maintain appropriate travel insurance</li>
              <li>• Follow property rules and local laws</li>
              <li>• Report issues promptly to property owners</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Dispute Resolution</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 1: Direct Communication</h3>
                <p className="text-muted-foreground text-sm">Attempt to resolve disputes directly with the other party</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 2: Platform Mediation</h3>
                <p className="text-muted-foreground text-sm">Contact Picnify support for mediation assistance</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 3: Formal Resolution</h3>
                <p className="text-muted-foreground text-sm">Binding arbitration for unresolved disputes</p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-primary/5 rounded-2xl p-8 text-center">
            <Scale className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Legal Questions?</h2>
            <p className="text-muted-foreground mb-6">Contact our legal team for clarification on these terms</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> {COMPANY_INFO.email.legal}</p>
              <p><strong>Address:</strong> {COMPANY_INFO.departments.legal}, {COMPANY_INFO.address.headquarters}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;