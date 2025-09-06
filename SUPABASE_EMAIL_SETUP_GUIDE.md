# 📧 Supabase Email Service Setup Guide - Picnify

## **Issue: No Email Notifications Being Sent**

The email verification emails are not being sent because the Supabase email service needs to be properly configured in the Supabase dashboard.

---

## **🚀 Step-by-Step Solution**

### **Step 1: Access Supabase Dashboard**

1. **Go to**: https://supabase.com/dashboard
2. **Sign in** with your credentials
3. **Select project**: `riqsgtuzccwpplbodwbd`

### **Step 2: Configure Email Service Provider**

#### **Option A: Use Supabase's Built-in Email Service (Recommended for Development)**

1. **Navigate to**: Authentication → Settings
2. **Find**: "Email" section
3. **Enable**: "Enable email confirmations"
4. **Set**: Site URL to `http://localhost:8080`
5. **Add**: Redirect URLs:
   ```
   http://localhost:8080/auth/callback
   http://localhost:8080/confirm-email
   ```

#### **Option B: Configure Custom SMTP (Recommended for Production)**

1. **Navigate to**: Authentication → Settings
2. **Find**: "SMTP Settings" section
3. **Enable**: "Enable custom SMTP"
4. **Configure** with your email provider:

**For Gmail:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: Picnify
```

**For SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: your-sendgrid-api-key
SMTP Admin Email: your-email@domain.com
SMTP Sender Name: Picnify
```

### **Step 3: Configure Email Templates**

1. **Navigate to**: Authentication → Email Templates
2. **Select**: "Confirm signup" template
3. **Customize** the template:

```html
<h2>Welcome to Picnify!</h2>
<p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>
<p>If you didn't create an account, please ignore this email.</p>
<p>Best regards,<br>The Picnify Team</p>
```

### **Step 4: Test Email Configuration**

1. **Save** all settings
2. **Wait** 2-3 minutes for changes to propagate
3. **Test** by creating a new account
4. **Check** email inbox and spam folder

---

## **🔧 Alternative: Use Resend Email Service**

If Supabase's built-in email service doesn't work, you can use Resend:

### **Step 1: Sign up for Resend**
1. Go to: https://resend.com
2. Create a free account
3. Get your API key

### **Step 2: Configure Resend in Supabase**
1. **Navigate to**: Authentication → Settings
2. **Enable**: "Enable custom SMTP"
3. **Configure**:
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: your-resend-api-key
SMTP Admin Email: your-verified-email@domain.com
SMTP Sender Name: Picnify
```

### **Step 3: Verify Domain (Optional)**
1. In Resend dashboard, add your domain
2. Verify domain ownership
3. Update sender email to use your domain

---

## **🧪 Testing Email Configuration**

### **Test 1: Create New Account**
1. Go to: http://localhost:8080/signup
2. Fill out the form with a real email
3. Submit the form
4. Check for success message
5. Check email inbox

### **Test 2: Resend Verification**
1. Go to: http://localhost:8080/resend-verification
2. Enter the email address
3. Click "Resend"
4. Check email inbox

### **Test 3: Check Supabase Logs**
1. Go to: Supabase Dashboard → Logs
2. Look for email-related logs
3. Check for any error messages

---

## **🚨 Troubleshooting**

### **Common Issues:**

1. **"Email service not configured"**
   - Solution: Enable email confirmations in Supabase dashboard

2. **"SMTP authentication failed"**
   - Solution: Check SMTP credentials and use app passwords for Gmail

3. **"Domain not verified"**
   - Solution: Verify your domain in the email service provider

4. **"Rate limit exceeded"**
   - Solution: Wait a few minutes before trying again

5. **"Email in spam folder"**
   - Solution: Check spam/junk folder, whitelist sender

### **Debug Steps:**

1. **Check Supabase Dashboard**:
   - Authentication → Settings → Email
   - Verify all settings are correct

2. **Check Browser Console**:
   - Look for any JavaScript errors
   - Check network requests

3. **Check Email Service Provider**:
   - Verify API keys are correct
   - Check sending limits
   - Review delivery logs

---

## **✅ Expected Results**

After proper configuration:

1. **User signs up** → Success message appears
2. **Email is sent** → Within 1-2 minutes
3. **User receives email** → In inbox (check spam if not)
4. **User clicks link** → Redirected to `/auth/callback`
5. **Account verified** → User logged in and redirected to dashboard

---

## **📞 Support**

If you're still having issues:

1. **Check Supabase Status**: https://status.supabase.com
2. **Review Documentation**: https://supabase.com/docs/guides/auth/email
3. **Contact Support**: Through Supabase dashboard

---

## **🔗 Quick Links**

- **Supabase Dashboard**: https://supabase.com/dashboard/project/riqsgtuzccwpplbodwbd
- **Authentication Settings**: https://supabase.com/dashboard/project/riqsgtuzccwpplbodwbd/auth/settings
- **Email Templates**: https://supabase.com/dashboard/project/riqsgtuzccwpplbodwbd/auth/templates
- **Logs**: https://supabase.com/dashboard/project/riqsgtuzccwpplbodwbd/logs
