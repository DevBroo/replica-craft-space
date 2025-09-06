# 🚨 EXACT Supabase Email Template Fix

## **Problem:** 
Your email link looks like: `http://localhost:8080/reset-password` (NO TOKENS!)
It should look like: `http://localhost:8080/reset-password?access_token=eyJhbG...&type=recovery` (WITH TOKENS!)

---

## **🔧 EXACT STEPS - DO THIS NOW:**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in 
3. Click on project: **riqsgtuzccwpplbodwbd**

### **Step 2: Go to Email Templates**
1. Click **Authentication** (left sidebar)
2. Click **Email Templates**
3. Click **"Reset Password"** template

### **Step 3: Check Current Template**
Your current template probably looks like:
```html
<p>Follow this link to reset your password: 
<a href="{{ .SiteURL }}/reset-password">Reset Password</a></p>
```
**^ THIS IS THE PROBLEM - NO TOKENS!**

### **Step 4: Replace with CORRECT Template**
**DELETE EVERYTHING** and paste this EXACT template:

```html
<h2>Reset Your Password</h2>
<p>Someone requested a password reset for your account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Your Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### **Step 5: Save**
1. Click **Save** 
2. **WAIT 2 MINUTES**

### **Step 6: Test**
1. Go to: `http://localhost:8080/forgot-password`
2. Enter email → Send reset
3. Check email
4. **Right-click the "Reset Your Password" link** → **Copy Link Address**
5. **Paste the link here** - it should now contain tokens!

---

## **🧪 Debug Test:**

I've added debug logging to your app. When you click the email link:

1. **Open browser developer console** (F12)
2. Click the email link
3. Look for these console logs:
   ```
   🔍 Full URL: http://localhost:8080/reset-password?access_token=...
   🔍 Parsed tokens: { accessToken: 'FOUND', refreshToken: 'FOUND' }
   ✅ Auth tokens found
   ```

**If you still see:**
```
🔍 Full URL: http://localhost:8080/reset-password
❌ No auth tokens found in URL
```

Then the email template is STILL WRONG!

---

## **🚀 Alternative Templates to Try:**

If `{{ .ConfirmationURL }}` doesn't work, try this:

```html
<h2>Reset Your Password</h2>
<p><a href="{{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery">Reset Password</a></p>
```

Or this:
```html
<h2>Reset Your Password</h2>
<p><a href="{{ .SiteURL }}/reset-password?access_token={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

---

## **✅ Success Check:**
After fixing, the email link should look like:
```
http://localhost:8080/reset-password?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&type=recovery
```

**NOT:**
```
http://localhost:8080/reset-password
```

