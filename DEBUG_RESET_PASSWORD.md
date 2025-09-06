# 🚨 URGENT: Fix Reset Password Email Configuration

## **Current Issue:**
The reset password email link doesn't contain authentication tokens, so it shows "Loading Reset Form..." then redirects back to forgot password.

## **Root Cause:**
Supabase email template configuration is missing or incorrect.

---

## **🔧 Step-by-Step Fix:**

### **Step 1: Access Supabase Dashboard**
1. Go to: **https://supabase.com/dashboard**
2. Sign in to your account
3. Select project: **riqsgtuzccwpplbodwbd**

### **Step 2: Fix Email Template**
1. Click **Authentication** in left sidebar
2. Click **Email Templates** 
3. Click **"Reset Password"** template
4. **REPLACE** the entire template with this:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>Someone requested to reset your password. If this was you, click the link below to reset your password:</p>
<p><a href="{{ .SiteURL }}/reset-password?access_token={{ .TokenHash }}&type=recovery">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks!</p>
```

### **Step 3: Check Site URL**
1. Go to **Authentication** → **Settings**
2. Make sure **Site URL** is: `http://localhost:8080`
3. Under **Redirect URLs**, add:
```
http://localhost:8080/reset-password
http://localhost:8080/**
```

### **Step 4: Save and Test**
1. Click **Save** on both pages
2. Wait 2-3 minutes for changes to propagate
3. Test the reset password flow again

---

## **🧪 Quick Test:**

1. Go to: `http://localhost:8080/forgot-password`
2. Enter your email → Click "Send reset link"
3. Check email - the link should now look like:
   ```
   http://localhost:8080/reset-password?access_token=LONG_TOKEN_HERE&type=recovery
   ```
4. Click the link - should show password reset form!

---

## **❓ If Still Not Working:**

The issue might be that Supabase is using the wrong email template format. Try this alternative:

### **Alternative Email Template:**
```html
<h2>Reset Your Password</h2>
<p>Click this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, ignore this email.</p>
```

---

## **🔍 Debug the Email:**
When you receive the email, **check the actual link URL**. It should contain:
- `access_token=...` 
- `type=recovery` or `refresh_token=...`

If the email link is just `http://localhost:8080/reset-password` with no tokens, then the email template is still wrong.

