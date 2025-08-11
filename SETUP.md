# Picnify - Phase 1 Setup Guide

## Authentication & User Management Implementation

This guide will walk you through setting up the complete authentication system for Picnify.

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Git

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Enable the following services in your Supabase dashboard:
   - Authentication
   - Database
   - Storage (optional for file uploads)

### 1.2 Configure Authentication

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Configure the following providers:
   - **Email**: Enable email/password authentication
   - **Phone**: Enable phone authentication (for OTP)
   - **Google**: Optional - enable Google OAuth

### 1.3 Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Execute the migration to create all tables and policies

### 1.4 Configure Row Level Security (RLS)

The migration script automatically sets up RLS policies, but verify they're working:

1. Go to **Authentication > Policies**
2. Ensure all tables have RLS enabled
3. Verify the policies are correctly applied

## Step 2: Environment Configuration

### 2.1 Create Environment File

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Update the environment variables with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 2.2 Update Supabase Client

1. Open `src/integrations/supabase/client.ts`
2. Replace the hardcoded values with environment variables:
   ```typescript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Application

```bash
npm run dev
```

The application should now be running at `http://localhost:8080`

## Step 5: Test Authentication

### 5.1 Test User Registration

1. Navigate to `/signup`
2. Create a new user account
3. Verify the user is created in Supabase dashboard

### 5.2 Test User Login

1. Navigate to `/login`
2. Try both email/password and OTP login methods
3. Verify successful authentication and role-based redirects

### 5.3 Test Protected Routes

1. Try accessing `/admin/dashboard` without authentication
2. Verify you're redirected to login
3. Login as different user types and verify proper access

## Step 6: Create Test Users

### 6.1 Admin User

1. Go to Supabase dashboard > **Table Editor > users**
2. Insert a test admin user:
   ```sql
   INSERT INTO users (email, first_name, last_name, role, is_verified, is_active)
   VALUES ('admin@picnify.com', 'Admin', 'User', 'admin', true, true);
   ```

### 6.2 Property Owner

```sql
INSERT INTO users (email, first_name, last_name, role, is_verified, is_active)
VALUES ('owner@picnify.com', 'Property', 'Owner', 'owner', true, true);
```

### 6.3 Agent

```sql
INSERT INTO users (email, first_name, last_name, role, is_verified, is_active)
VALUES ('agent@picnify.com', 'Travel', 'Agent', 'agent', true, true);
```

### 6.4 Customer

```sql
INSERT INTO users (email, first_name, last_name, role, is_verified, is_active)
VALUES ('customer@picnify.com', 'John', 'Customer', 'customer', true, true);
```

## Step 7: Verify Implementation

### 7.1 Authentication Flow

- ✅ User registration with role selection
- ✅ Email/password login
- ✅ OTP-based login
- ✅ Session management
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Automatic redirects

### 7.2 Database Integration

- ✅ User profiles stored in database
- ✅ RLS policies working correctly
- ✅ Authentication state synchronized
- ✅ Role-based permissions enforced

### 7.3 UI/UX

- ✅ Clean, modern login interface
- ✅ Loading states and error handling
- ✅ Responsive design
- ✅ Accessibility features

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables
   - Check if Supabase project is active
   - Ensure anon key is correct

2. **RLS Policy Issues**
   - Verify policies are enabled
   - Check user roles are set correctly
   - Test with different user types

3. **Authentication Not Working**
   - Check browser console for errors
   - Verify Supabase auth settings
   - Ensure email confirmation is configured

4. **TypeScript Errors**
   - Run `npm run build` to check for type issues
   - Update types if database schema changes

### Debug Mode

Enable debug logging by adding to your environment:

```env
VITE_DEBUG=true
```

## Next Steps

After completing Phase 1, you can proceed to:

1. **Phase 2**: Core Data Models (Properties, Bookings, etc.)
2. **Phase 3**: Real-time Features
3. **Phase 4**: Advanced Features (Payments, Analytics)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check browser console for error messages
4. Verify all environment variables are set correctly

## Security Notes

- Never commit `.env.local` to version control
- Use strong passwords for admin accounts
- Regularly rotate API keys
- Monitor authentication logs in Supabase dashboard
- Implement rate limiting for production use
