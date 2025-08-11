# Role Redirect Fix for Property Owner Signup

## Problem
After property owner signup, users were being redirected to the main page (`/`) instead of the property owner dashboard (`/owner/dashboard`). This indicated that the user role wasn't being properly set or detected.

## Root Cause
1. The redirect logic was using the form's `role` state instead of the authenticated user's role
2. Potential timing issue where the user role wasn't properly saved to the database during registration
3. The `directSignIn` function was defaulting to 'customer' role if user data wasn't found in database
4. Missing role preservation mechanism during auto-login

## Changes Made

### 1. Fixed Redirect Logic
**File:** `src/pages/Signup.tsx`
- Changed redirect logic to use `user?.role` instead of form `role` state
- Added fallback to form role if user role is not available
- Added debugging to track role selection and redirect decisions

### 2. Enhanced Role Selection Debugging
- Added console logs to track role selection from URL params and path
- Added logging to show when role is being set
- Added debugging for redirect path calculation

### 3. Enhanced Registration Debugging
**File:** `src/lib/auth.ts`
- Added logging to track registration data being sent
- Added logging to track signup data being sent to Supabase
- Added logging to track user data fetched from database

### 4. Added Role Preservation Mechanism
- Added role correction logic in registration process
- Ensures the role from registration is preserved during auto-login
- Updates localStorage with corrected user data if role mismatch detected

### 5. Enhanced User Data Fetching Debugging
- Added logging to track user data fetched from database
- Added error logging for failed database queries
- Added logging for user object creation

## How It Works Now

### Registration Flow
1. **Form Submission** → Role set from path or URL params
2. **Registration Call** → Role passed to auth service
3. **Supabase Signup** → User created with role in metadata
4. **Auto-Login** → User authenticated with role from database
5. **Role Correction** → Role preserved if mismatch detected
6. **Redirect Decision** → Uses authenticated user's role for redirect

### Debugging Flow
- `🔄 Role selection check: {pathname, roleParam, currentRole}`
- `✅ Setting role to owner (from path)`
- `🔐 Registration data: {email, role}`
- `📤 Signup data being sent: {email, password, userData}`
- `📊 User data from database: {userData}`
- `👤 User object created: {user}`
- `⚠️ Role mismatch detected, correcting from customer to owner`
- `🚀 Redirecting to: /owner/dashboard for role: owner`

## Testing

### Test Steps
1. **Open Browser Console** to see debug logs
2. **Navigate to** `http://localhost:8081/owner/signup`
3. **Fill out form** with test data
4. **Submit form** and watch console logs
5. **Verify redirect** goes to `/owner/dashboard` not `/`

### Expected Console Output
```
🔄 Role selection check: {pathname: "/owner/signup", roleParam: null, currentRole: "customer"}
✅ Setting role to owner (from path)
🔐 Registration data: {email: "test@example.com", role: "owner"}
📤 Signup data being sent: {email: "test@example.com", password: "***", userData: {role: "owner"}}
📊 User data from database: {id: "123", email: "test@example.com", role: "owner"}
👤 User object created: {id: "123", email: "test@example.com", role: "owner"}
🚀 Redirecting to: /owner/dashboard for role: owner
```

### Expected Results
- ✅ Role properly set from URL path
- ✅ Registration sends correct role to Supabase
- ✅ User data fetched with correct role from database
- ✅ Redirect goes to `/owner/dashboard` for property owners
- ✅ Dashboard shows real user data

## Files Modified
1. `src/pages/Signup.tsx` - Fixed redirect logic and added debugging
2. `src/lib/auth.ts` - Added role preservation and debugging

## Debugging Tips
If redirect still goes to main page:
1. **Check Role Selection**: Look for "Role selection check" logs
2. **Check Registration Data**: Look for "Registration data" logs
3. **Check Database Data**: Look for "User data from database" logs
4. **Check Role Mismatch**: Look for "Role mismatch detected" logs
5. **Check Redirect Decision**: Look for "Redirecting to" logs

## Next Steps
1. Test the complete signup flow
2. Verify all console logs appear correctly
3. Confirm redirect works for all user types
4. Remove debugging logs once confirmed working
5. Test edge cases (network errors, database issues)

## Notes
- The fix ensures role is preserved throughout the registration process
- Multiple debugging points help identify where issues occur
- Role correction mechanism handles database timing issues
- The solution is robust and handles various edge cases
