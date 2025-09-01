import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-poppins">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
