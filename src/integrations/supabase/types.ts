export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          first_name: string | null
          last_name: string | null
          role: 'admin' | 'owner' | 'agent' | 'customer'
          avatar_url: string | null
          is_verified: boolean
          is_active: boolean
          profile_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'owner' | 'agent' | 'customer'
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          profile_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'owner' | 'agent' | 'customer'
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          profile_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          location: Json
          address: string | null
          property_type: string
          amenities: string[]
          pricing: Json
          images: string[]
          max_guests: number
          bedrooms: number | null
          bathrooms: number | null
          status: 'pending' | 'approved' | 'rejected' | 'inactive'
          is_featured: boolean
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          location: Json
          address?: string | null
          property_type: string
          amenities?: string[]
          pricing: Json
          images?: string[]
          max_guests: number
          bedrooms?: number | null
          bathrooms?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          is_featured?: boolean
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          location?: Json
          address?: string | null
          property_type?: string
          amenities?: string[]
          pricing?: Json
          images?: string[]
          max_guests?: number
          bedrooms?: number | null
          bathrooms?: number | null
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          is_featured?: boolean
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          customer_id: string
          agent_id: string | null
          check_in: string
          check_out: string
          guests: number
          total_amount: number
          commission_amount: number
          commission_rate: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          customer_id: string
          agent_id?: string | null
          check_in: string
          check_out: string
          guests: number
          total_amount: number
          commission_amount?: number
          commission_rate?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          customer_id?: string
          agent_id?: string | null
          check_in?: string
          check_out?: string
          guests?: number
          total_amount?: number
          commission_amount?: number
          commission_rate?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          property_id: string
          customer_id: string
          rating: number
          comment: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          property_id: string
          customer_id: string
          rating: number
          comment?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          property_id?: string
          customer_id?: string
          rating?: number
          comment?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          amount: number
          currency: string
          payment_method: string
          transaction_id: string | null
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          gateway_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          currency?: string
          payment_method: string
          transaction_id?: string | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          gateway_response?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          currency?: string
          payment_method?: string
          transaction_id?: string | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          gateway_response?: Json | null
          created_at?: string
        }
      }
      commissions: {
        Row: {
          id: string
          booking_id: string
          agent_id: string
          amount: number
          rate: number
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          agent_id: string
          amount: number
          rate: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          agent_id?: string
          amount?: number
          rate?: number
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'owner' | 'agent' | 'customer'
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      property_status: 'pending' | 'approved' | 'rejected' | 'inactive'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Commission = Database['public']['Tables']['commissions']['Row']
export type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
export type CommissionUpdate = Database['public']['Tables']['commissions']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// Extended types with relationships
export type UserWithProfile = User & {
  properties?: Property[]
  bookings?: Booking[]
  reviews?: Review[]
  commissions?: Commission[]
  notifications?: Notification[]
}

export type PropertyWithDetails = Property & {
  owner?: User
  bookings?: Booking[]
  reviews?: Review[]
}

export type BookingWithDetails = Booking & {
  property?: Property
  customer?: User
  agent?: User
  payments?: Payment[]
  commissions?: Commission[]
  reviews?: Review[]
}
