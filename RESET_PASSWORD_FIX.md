# 🔧 Reset Password Email Fix

## **Issue:** 
Reset password email links are redirecting back to forgot password page instead of the reset form.

## **Root Cause:**
Supabase email links sometimes put authentication tokens in URL hash (`#`) instead of query parameters (`?`), but the app was only checking query parameters.

## **✅ Fix Applied:**
1. **Updated ResetPassword page** to check both URL query parameters AND hash
2. **Added better error handling** and debug logging
3. **Increased timeout** to give Supabase more time to process auth callback

## **🚀 Supabase Dashboard Configuration:**

### **Step 1: Check Email Template Settings**
1. Go to: **https://supabase.com/dashboard**
2. Select project: `riqsgtuzccwpplbodwbd`
3. Navigate to: **Authentication** → **Email Templates**
4. Click on **"Reset Password"** template

### **Step 2: Verify Redirect URL**
Make sure the redirect URL in the email template is:
```
http://localhost:8080/reset-password
```

### **Step 3: Update Site URL & Redirect URLs**
1. Go to: **Authentication** → **Settings**
2. **Site URL** should be: `http://localhost:8080`
3. **Redirect URLs** should include:
```
http://localhost:8080/reset-password
http://localhost:8080/forgot-password
http://localhost:8080/**
```

### **Step 4: Test the Flow**
1. Go to forgot password page: `http://localhost:8080/forgot-password`
2. Enter your email and click "Send reset link"
3. Check email for reset link
4. Click the link - should now go to reset password form instead of forgot password page

## **🎯 Expected Behavior After Fix:**
- ✅ Email link opens reset password form
- ✅ Form allows entering new password
- ✅ Password gets updated successfully
- ✅ User is redirected to login page

## **📝 Debugging:**
If still having issues, check browser console for:
- `✅ Auth tokens found:` (tokens detected)
- `❌ No auth tokens found in URL` (no tokens, will redirect)

The fix handles both URL formats that Supabase might use:
- `http://localhost:8080/reset-password?access_token=xxx&refresh_token=yyy`
- `http://localhost:8080/reset-password#access_token=xxx&refresh_token=yyy`

