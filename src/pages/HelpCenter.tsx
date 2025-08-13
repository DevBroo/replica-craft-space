import { Search, HelpCircle, Book, CreditCard, MapPin, User, Phone, Mail } from 'lucide-react';
import { useState } from 'react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqCategories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'booking', name: 'Booking', icon: Book },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'property', name: 'Properties', icon: MapPin },
    { id: 'account', name: 'Account', icon: User },
  ];

  const faqs = [
    {
      category: 'booking',
      question: 'How do I book a property?',
      answer: 'Select your desired property, choose dates and group size, then click "Book Now" to complete your reservation with secure payment.'
    },
    {
      category: 'booking',
      question: 'Can I modify my booking?',
      answer: 'Yes, you can modify your booking up to 24 hours before check-in, subject to availability and property policies.'
    },
    {
      category: 'booking',
      question: 'What is the cancellation policy?',
      answer: 'Free cancellation up to 24 hours before check-in. Partial refunds for 24-48 hours notice. No refund for same-day cancellations.'
    },
    {
      category: 'payment',
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards, debit cards, UPI, net banking, and digital wallets like Paytm and PhonePe.'
    },
    {
      category: 'payment',
      question: 'When will I be charged?',
      answer: 'Payment is processed immediately upon booking confirmation. You will receive a payment receipt via email.'
    },
    {
      category: 'payment',
      question: 'Is it safe to pay online?',
      answer: 'Yes, all payments are processed through secure, encrypted gateways with PCI DSS compliance for maximum security.'
    },
    {
      category: 'property',
      question: 'How are properties verified?',
      answer: 'All properties undergo thorough verification including photo verification, document checks, and on-site inspections.'
    },
    {
      category: 'property',
      question: 'What if the property doesn\'t match the listing?',
      answer: 'Contact us immediately if the property doesn\'t match. We offer full refunds for misrepresented properties.'
    },
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click "Sign Up" and provide your email, phone number, and create a password. Verify your email to activate your account.'
    },
    {
      category: 'account',
      question: 'I forgot my password. What should I do?',
      answer: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a password reset link within minutes.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl opacity-90">Find answers to your questions and get support</p>
        </div>
      </header>

      {/* Search */}
      <section className="bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg border border-border bg-background text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Categories */}
        <div className="flex flex-wrap gap-4 mb-12 justify-center">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70'
              }`}
            >
              <category.icon className="w-5 h-5 mr-2" />
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredFaqs.map((faq, index) => (
              <details key={index} className="border rounded-lg overflow-hidden">
                <summary className="p-6 cursor-pointer font-semibold hover:bg-muted/50 transition-colors">
                  {faq.question}
                </summary>
                <div className="px-6 pb-6 text-muted-foreground">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
          
          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your search or browse different categories</p>
            </div>
          )}
        </section>

        {/* Contact Support */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center mb-8">Still Need Help?</h2>
          <p className="text-center text-muted-foreground mb-8">
            Our support team is here to help you 24/7
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Call Us</h3>
              <p className="text-muted-foreground mb-4">Available 24/7 for urgent assistance</p>
              <p className="font-semibold">1800-XXX-XXXX</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Support</h3>
              <p className="text-muted-foreground mb-4">Get detailed help via email</p>
              <p className="font-semibold">support@picnify.com</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
              <p className="text-muted-foreground mb-4">Chat with our support agents</p>
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Start Chat
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HelpCenter;