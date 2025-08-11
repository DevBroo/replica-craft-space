-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'agent', 'customer');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE property_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location JSONB NOT NULL, -- {city, state, country, coordinates}
  address TEXT,
  property_type TEXT NOT NULL, -- hotel, villa, resort, lodge, apartment
  amenities TEXT[] DEFAULT '{}',
  pricing JSONB NOT NULL, -- {base_price, currency, additional_fees}
  images TEXT[] DEFAULT '{}',
  max_guests INTEGER NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  status property_status DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status payment_status DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- booking, payment, system, etc.
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties USING GIN(location);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_commissions_agent ON commissions(agent_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for properties table
CREATE POLICY "Anyone can view approved properties" ON properties
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Property owners can view their own properties" ON properties
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Property owners can manage their own properties" ON properties
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for bookings table
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (customer_id = auth.uid() OR agent_id = auth.uid());

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Property owners can view bookings for their properties" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties WHERE id = property_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for reviews table
CREATE POLICY "Anyone can view public reviews" ON reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own reviews" ON reviews
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings WHERE id = booking_id AND customer_id = auth.uid()
    )
  );

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings WHERE id = booking_id AND customer_id = auth.uid()
    )
  );

-- RLS Policies for commissions table
CREATE POLICY "Agents can view their own commissions" ON commissions
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can manage all commissions" ON commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Insert default admin user (you should change this password)
INSERT INTO users (email, first_name, last_name, role, is_verified, is_active)
VALUES ('admin@picnify.com', 'Admin', 'User', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;
