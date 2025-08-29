export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bank_details_audit_log: {
        Row: {
          access_type: string
          accessed_by: string
          accessed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          owner_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          accessed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          owner_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          accessed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          owner_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agent_id: string | null
          booking_details: Json | null
          check_in_date: string
          check_out_date: string
          created_at: string
          guests: number
          id: string
          payment_status: string
          property_id: string
          refund_amount: number
          refund_status: string
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          booking_details?: Json | null
          check_in_date: string
          check_out_date: string
          created_at?: string
          guests?: number
          id?: string
          payment_status?: string
          property_id: string
          refund_amount?: number
          refund_status?: string
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          booking_details?: Json | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guests?: number
          id?: string
          payment_status?: string
          property_id?: string
          refund_amount?: number
          refund_status?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          min_order_amount: number
          property_ids: string[] | null
          status: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          min_order_amount?: number
          property_ids?: string[] | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          min_order_amount?: number
          property_ids?: string[] | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      day_picnic_hourly_rates: {
        Row: {
          created_at: string
          hour_number: number
          id: string
          meal_plan: string
          package_id: string
          price_per_package: number
          price_per_person: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hour_number: number
          id?: string
          meal_plan: string
          package_id: string
          price_per_package?: number
          price_per_person?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hour_number?: number
          id?: string
          meal_plan?: string
          package_id?: string
          price_per_package?: number
          price_per_person?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_picnic_hourly_rates_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "day_picnic_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      day_picnic_meal_prices: {
        Row: {
          created_at: string
          id: string
          meal_plan: string
          package_id: string
          price_per_package: number
          price_per_person: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_plan: string
          package_id: string
          price_per_package?: number
          price_per_person?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_plan?: string
          package_id?: string
          price_per_package?: number
          price_per_person?: number
          updated_at?: string
        }
        Relationships: []
      }
      day_picnic_option_prices: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          name: string
          option_type: string
          package_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          name: string
          option_type: string
          package_id: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          name?: string
          option_type?: string
          package_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_picnic_option_prices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "day_picnic_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      day_picnic_packages: {
        Row: {
          add_ons: Json
          base_price: number
          created_at: string
          duration_hours: number
          end_time: string
          exclusions: Json
          id: string
          inclusions: Json
          meal_plan: string[]
          min_hours: number
          pricing_type: string
          property_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          add_ons?: Json
          base_price?: number
          created_at?: string
          duration_hours?: number
          end_time: string
          exclusions?: Json
          id?: string
          inclusions?: Json
          meal_plan?: string[]
          min_hours?: number
          pricing_type?: string
          property_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          add_ons?: Json
          base_price?: number
          created_at?: string
          duration_hours?: number
          end_time?: string
          exclusions?: Json
          id?: string
          inclusions?: Json
          meal_plan?: string[]
          min_hours?: number
          pricing_type?: string
          property_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_picnic_packages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_picnic_packages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_banners: {
        Row: {
          background_image: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          end_date: string | null
          id: string
          position: string
          start_date: string | null
          status: string
          subtitle: string | null
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          id?: string
          position: string
          start_date?: string | null
          status?: string
          subtitle?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          id?: string
          position?: string
          start_date?: string | null
          status?: string
          subtitle?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string
          id: string
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          expires_at: string | null
          id: string
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          status: string
          target_audience: string | null
          target_user_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          target_audience?: string | null
          target_user_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: string
          target_audience?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          created_at: string
          id: string
          metadata: Json
          owner_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_activity_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          owner_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_admin_actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          account_type: string | null
          bank_name: string
          branch_name: string | null
          created_at: string
          id: string
          ifsc_code: string
          micr_code: string | null
          owner_id: string
          pan_number: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_type?: string | null
          bank_name: string
          branch_name?: string | null
          created_at?: string
          id?: string
          ifsc_code: string
          micr_code?: string | null
          owner_id: string
          pan_number?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          branch_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string
          micr_code?: string | null
          owner_id?: string
          pan_number?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_bank_details_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_payouts: {
        Row: {
          commission_amount: number
          created_at: string
          gross_revenue: number
          id: string
          metadata: Json
          owner_id: string
          payout_amount: number
          period_end: string | null
          period_start: string | null
          status: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          metadata?: Json
          owner_id: string
          payout_amount?: number
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          metadata?: Json
          owner_id?: string
          payout_amount?: number
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_payouts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_profiles: {
        Row: {
          aadhar_number: string | null
          company_name: string | null
          created_at: string
          documents: Json | null
          gst_number: string | null
          is_office_same_as_property: boolean
          logo_url: string | null
          office_address: Json | null
          pan_number: string | null
          property_count: number
          property_types_offered: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhar_number?: string | null
          company_name?: string | null
          created_at?: string
          documents?: Json | null
          gst_number?: string | null
          is_office_same_as_property?: boolean
          logo_url?: string | null
          office_address?: Json | null
          pan_number?: string | null
          property_count?: number
          property_types_offered?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhar_number?: string | null
          company_name?: string | null
          created_at?: string
          documents?: Json | null
          gst_number?: string | null
          is_office_same_as_property?: boolean
          logo_url?: string | null
          office_address?: Json | null
          pan_number?: string | null
          property_count?: number
          property_types_offered?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos_with_captions: {
        Row: {
          alt_text: string | null
          caption: string | null
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          commission_rate: number
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_access_audit: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          accessed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          profile_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          accessed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          profile_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          accessed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          profile_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          admin_blocked: boolean
          amenities: string[] | null
          amenities_details: Json | null
          arrival_instructions: string | null
          banquet_hall_capacity: number | null
          bathrooms: number | null
          bed_configuration: Json | null
          bedrooms: number | null
          booking_rules: Json | null
          cancellation_policy: string | null
          capacity_per_room: number | null
          check_in_time: string | null
          check_out_time: string | null
          contact_phone: string | null
          coordinates: Json | null
          country: string | null
          created_at: string
          day_picnic_capacity: number | null
          day_picnic_duration_category: string | null
          description: string | null
          extra_services: Json | null
          facilities: Json | null
          ground_lawn_capacity: number | null
          host_details: Json
          house_rules: Json | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          languages_spoken: Json | null
          license_number: string | null
          location: Json | null
          max_guests: number
          meal_plans: string[] | null
          menu_available: boolean
          minimum_stay: number | null
          nearby_attractions: Json | null
          owner_id: string
          payment_methods: string[] | null
          policies_extended: Json | null
          postal_code: string | null
          pricing: Json
          property_subtype: string | null
          property_type: string
          rating: number | null
          review_count: number | null
          rooms_count: number | null
          rooms_details: Json | null
          safety_security: Json | null
          seasonal_pricing: Json | null
          star_rating: number | null
          status: string | null
          tax_information: Json | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          address: string
          admin_blocked?: boolean
          amenities?: string[] | null
          amenities_details?: Json | null
          arrival_instructions?: string | null
          banquet_hall_capacity?: number | null
          bathrooms?: number | null
          bed_configuration?: Json | null
          bedrooms?: number | null
          booking_rules?: Json | null
          cancellation_policy?: string | null
          capacity_per_room?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string
          day_picnic_capacity?: number | null
          day_picnic_duration_category?: string | null
          description?: string | null
          extra_services?: Json | null
          facilities?: Json | null
          ground_lawn_capacity?: number | null
          host_details?: Json
          house_rules?: Json | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          languages_spoken?: Json | null
          license_number?: string | null
          location?: Json | null
          max_guests?: number
          meal_plans?: string[] | null
          menu_available?: boolean
          minimum_stay?: number | null
          nearby_attractions?: Json | null
          owner_id: string
          payment_methods?: string[] | null
          policies_extended?: Json | null
          postal_code?: string | null
          pricing?: Json
          property_subtype?: string | null
          property_type: string
          rating?: number | null
          review_count?: number | null
          rooms_count?: number | null
          rooms_details?: Json | null
          safety_security?: Json | null
          seasonal_pricing?: Json | null
          star_rating?: number | null
          status?: string | null
          tax_information?: Json | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          address?: string
          admin_blocked?: boolean
          amenities?: string[] | null
          amenities_details?: Json | null
          arrival_instructions?: string | null
          banquet_hall_capacity?: number | null
          bathrooms?: number | null
          bed_configuration?: Json | null
          bedrooms?: number | null
          booking_rules?: Json | null
          cancellation_policy?: string | null
          capacity_per_room?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact_phone?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string
          day_picnic_capacity?: number | null
          day_picnic_duration_category?: string | null
          description?: string | null
          extra_services?: Json | null
          facilities?: Json | null
          ground_lawn_capacity?: number | null
          host_details?: Json
          house_rules?: Json | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          languages_spoken?: Json | null
          license_number?: string | null
          location?: Json | null
          max_guests?: number
          meal_plans?: string[] | null
          menu_available?: boolean
          minimum_stay?: number | null
          nearby_attractions?: Json | null
          owner_id?: string
          payment_methods?: string[] | null
          policies_extended?: Json | null
          postal_code?: string | null
          pricing?: Json
          property_subtype?: string | null
          property_type?: string
          rating?: number | null
          review_count?: number | null
          rooms_count?: number | null
          rooms_details?: Json | null
          safety_security?: Json | null
          seasonal_pricing?: Json | null
          star_rating?: number | null
          status?: string | null
          tax_information?: Json | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_availability: {
        Row: {
          booked_units: number
          booking_name: string | null
          category: string
          created_at: string
          day: string
          id: string
          property_id: string
          status: string
          total_capacity: number
          updated_at: string
        }
        Insert: {
          booked_units?: number
          booking_name?: string | null
          category: string
          created_at?: string
          day: string
          id?: string
          property_id: string
          status?: string
          total_capacity?: number
          updated_at?: string
        }
        Update: {
          booked_units?: number
          booking_name?: string | null
          category?: string
          created_at?: string
          day?: string
          id?: string
          property_id?: string
          status?: string
          total_capacity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      property_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          comment: string | null
          created_at: string
          from_status: string | null
          id: string
          property_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          property_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          property_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_status_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_status_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          property_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_admin_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_summary_for_owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_saved_properties_property_id"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_saved_properties_property_id"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_admin_list: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          guests: number | null
          id: string | null
          owner_id: string | null
          owner_name: string | null
          payment_status: string | null
          property_id: string | null
          property_title: string | null
          refund_amount: number | null
          refund_status: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_summary_for_owners: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          guest_reference: string | null
          guests: number | null
          id: string | null
          property_id: string | null
          property_title: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_public: {
        Row: {
          amenities: string[] | null
          arrival_instructions: string | null
          bathrooms: number | null
          bed_configuration: Json | null
          bedrooms: number | null
          booking_rules: Json | null
          cancellation_policy: string | null
          check_in_time: string | null
          check_out_time: string | null
          coordinates: Json | null
          country: string | null
          created_at: string | null
          description: string | null
          general_location: string | null
          house_rules: Json | null
          id: string | null
          images: string[] | null
          is_featured: boolean | null
          location: Json | null
          max_guests: number | null
          meal_plans: string[] | null
          minimum_stay: number | null
          payment_methods: string[] | null
          postal_code: string | null
          pricing: Json | null
          property_subtype: string | null
          property_type: string | null
          rating: number | null
          review_count: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          arrival_instructions?: string | null
          bathrooms?: number | null
          bed_configuration?: Json | null
          bedrooms?: number | null
          booking_rules?: Json | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          general_location?: never
          house_rules?: Json | null
          id?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          location?: Json | null
          max_guests?: number | null
          meal_plans?: string[] | null
          minimum_stay?: number | null
          payment_methods?: string[] | null
          postal_code?: string | null
          pricing?: Json | null
          property_subtype?: string | null
          property_type?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          arrival_instructions?: string | null
          bathrooms?: number | null
          bed_configuration?: Json | null
          bedrooms?: number | null
          booking_rules?: Json | null
          cancellation_policy?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          coordinates?: Json | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          general_location?: never
          house_rules?: Json | null
          id?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          location?: Json | null
          max_guests?: number | null
          meal_plans?: string[] | null
          minimum_stay?: number | null
          payment_methods?: string[] | null
          postal_code?: string | null
          pricing?: Json | null
          property_subtype?: string | null
          property_type?: string | null
          rating?: number | null
          review_count?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_bank_details_safe: {
        Args: { p_owner_id: string }
        Returns: {
          account_holder_name: string
          account_number_masked: string
          account_type: string
          bank_name: string
          branch_name: string
          id: string
          ifsc_code: string
          micr_code: string
          pan_number_masked: string
          upi_id_masked: string
        }[]
      }
      get_booking_analytics: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          average_booking_value: number
          bookings_by_status: Json
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_booking_analytics_detailed: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          average_booking_value: number
          bookings_by_status: Json
          cancellations: number
          payments_by_status: Json
          refunds: Json
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_highest_rated_properties: {
        Args: { limit_count?: number; min_reviews?: number }
        Returns: {
          property_id: string
          property_title: string
          rating: number
          review_count: number
        }[]
      }
      get_profile_admin_full: {
        Args: { p_access_reason: string; p_profile_id: string }
        Returns: {
          avatar_url: string
          commission_rate: number
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string
          role: string
          updated_at: string
        }[]
      }
      get_profile_secure: {
        Args: { p_access_reason?: string; p_profile_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          email_masked: string
          full_name: string
          id: string
          is_active: boolean
          phone_masked: string
          role: string
        }[]
      }
      get_profiles_admin_list: {
        Args: {
          p_access_reason?: string
          p_limit?: number
          p_offset?: number
          p_role_filter?: string
          p_search?: string
        }
        Returns: {
          created_at: string
          email_partial: string
          full_name: string
          id: string
          is_active: boolean
          phone_partial: string
          role: string
          total_count: number
        }[]
      }
      get_property_approval_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_pending_hours: number
          total_approved: number
          total_pending: number
          total_rejected: number
        }[]
      }
      get_property_contact_info: {
        Args: { property_id: string }
        Returns: {
          contact_phone: string
          owner_email: string
          property_title: string
        }[]
      }
      get_revenue_by_agent: {
        Args: {
          end_date?: string
          limit_count?: number
          offset_count?: number
          sort_by?: string
          sort_dir?: string
          start_date?: string
          v_owner_filter?: string
          v_property_type_filter?: string
        }
        Returns: {
          agent_id: string
          agent_name: string
          bookings_count: number
          cancellations: number
          refunds_total: number
          revenue: number
        }[]
      }
      get_revenue_by_owner: {
        Args: {
          end_date?: string
          limit_count?: number
          offset_count?: number
          sort_by?: string
          sort_dir?: string
          start_date?: string
          v_agent_filter?: string
          v_property_type_filter?: string
        }
        Returns: {
          bookings_count: number
          cancellations: number
          owner_id: string
          owner_name: string
          refunds_total: number
          revenue: number
        }[]
      }
      get_revenue_by_property: {
        Args: {
          end_date?: string
          limit_count?: number
          offset_count?: number
          sort_by?: string
          sort_dir?: string
          start_date?: string
          v_agent_filter?: string
          v_owner_filter?: string
          v_property_type_filter?: string
        }
        Returns: {
          bookings_count: number
          cancellations: number
          owner_id: string
          owner_name: string
          property_id: string
          property_title: string
          refunds_total: number
          revenue: number
        }[]
      }
      get_time_series_analytics: {
        Args: {
          end_date?: string
          granularity?: string
          start_date?: string
          v_agent_id?: string
          v_owner_id?: string
          v_property_type?: string
        }
        Returns: {
          average_booking_value: number
          bookings_by_status: Json
          cancellations: number
          payments_by_status: Json
          period: string
          refunds_total: number
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_top_properties: {
        Args: { end_date?: string; limit_count?: number; start_date?: string }
        Returns: {
          bookings_count: number
          property_id: string
          property_title: string
          revenue: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_bank_details_access: {
        Args: {
          p_access_type: string
          p_accessed_fields?: string[]
          p_owner_id: string
        }
        Returns: boolean
      }
      log_contact_access: {
        Args: { property_id: string; user_id?: string }
        Returns: boolean
      }
      log_owner_activity_fn: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_type: string
          p_metadata: Json
          p_owner_id: string
        }
        Returns: undefined
      }
      log_profile_access: {
        Args: {
          p_access_reason?: string
          p_access_type: string
          p_accessed_fields?: string[]
          p_profile_id: string
        }
        Returns: boolean
      }
      log_property_status_change: {
        Args: {
          p_comment?: string
          p_property_id: string
          p_reason?: string
          p_to_status: string
        }
        Returns: boolean
      }
      update_owner_property_count_fn: {
        Args: { p_owner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
