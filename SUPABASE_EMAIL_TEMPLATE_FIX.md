# 🚨 CRITICAL: Supabase Email Template Fix

## **Issue:** 
Email link has NO authentication tokens, showing "Loading Reset Form..." then redirecting to forgot password.

## **Root Cause:**
Supabase email template is using wrong variables or missing template entirely.

---

## **🔧 EXACT STEPS TO FIX:**

### **Step 1: Check Current Email Template**
1. Go to: **https://supabase.com/dashboard**
2. Select project: **riqsgtuzccwpplbodwbd**
3. **Authentication** → **Email Templates**
4. Click **"Reset Password"** template

### **Step 2: Check What's Currently There**
Look at the current template. It might look like:
```html
<p>Follow this link to reset your password: <a href="{{ .SiteURL }}/reset-password">Reset Password</a></p>
```
**^ THIS IS WRONG - NO TOKENS!**

### **Step 3: Replace with Correct Template**
**DELETE EVERYTHING** and replace with this EXACT template:

```html
<h2>Reset Your Password</h2>
<p>Someone requested a password reset for your account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Your Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

**OR try this alternative if above doesn't work:**

```html
<h2>Reset Your Password</h2>
<p>Click this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery">Reset Password</a></p>
<p>If you didn't request this, ignore this email.</p>
```

### **Step 4: Save and Wait**
1. Click **Save**
2. **WAIT 5 MINUTES** - Supabase needs time to update
3. Test again

---

## **🧪 Test Process:**

1. Go to: `http://localhost:8080/forgot-password`
2. Enter email and send reset
3. **Check email** - the link should now look like:
   ```
   http://localhost:8080/reset-password?access_token=eyJhbGciOi...&type=recovery
   ```
   **OR**
   ```
   http://localhost:8080/reset-password#access_token=eyJhbGciOi...&refresh_token=...
   ```

4. Click link - should open password reset form!

---

## **🔍 If STILL Not Working:**

### **Check Site URL Setting:**
1. **Authentication** → **Settings** 
2. **Site URL** should be: `http://localhost:8080` 
3. **NOT:** `http://localhost:8080/` (no trailing slash)

### **Alternative: Use Auth Callback URL**
If the template still doesn't work, try this in the **resetPasswordForEmail** call:

In `src/contexts/AuthContext.tsx`, update the redirect URL:
```typescript
const redirectTo = useModal
  ? `${window.location.origin}/auth/reset-password-modal`
  : `${window.location.origin}/reset-password`;
```

Change to:
```typescript
const redirectTo = useModal
  ? `${window.location.origin}/auth/reset-password-modal`
  : `${window.location.origin}/auth/callback?next=/reset-password`;
```

---

## **⚡ Quick Debug:**
When you get the email, **right-click the "Reset Password" link** and select "Copy Link Address". Paste it here to see if it contains tokens.

**Expected:** Long URL with `access_token=...` 
**Problem:** Just `http://localhost:8080/reset-password` with no tokens

