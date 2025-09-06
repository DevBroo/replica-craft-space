# 📧 Check Supabase Email Settings

## 🔍 **How to Check if Email Sending is Enabled:**

### **Method 1: Supabase Dashboard**
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `riqsgtuzccwpplbodwbd`
3. Go to **Authentication** → **Settings**
4. Check **Email** section:
   - ✅ **Enable email confirmations** should be ON
   - ✅ **Enable email signup** should be ON
   - ✅ **SMTP settings** should be configured

### **Method 2: Check Email Templates**
1. In Supabase dashboard → **Authentication** → **Email Templates**
2. Look for **Confirm signup** template
3. Should contain: "Welcome to Picnify! Please confirm your email address by clicking the link below: {{ .ConfirmationURL }}"

### **Method 3: Check Email Logs**
1. In Supabase dashboard → **Authentication** → **Users**
2. Find your test user
3. Check if there are any email sending errors

## 🚨 **Common Issues:**

### **Issue 1: Free Tier Email Limits**
- **Supabase Free Tier** has limited email sending
- **Daily Limit**: 50 emails per day
- **Monthly Limit**: 1,500 emails per month
- **Solution**: Check if you've hit the limit

### **Issue 2: SMTP Not Configured**
- **Default**: Uses Supabase's email service
- **Custom SMTP**: Can be configured for better delivery
- **Solution**: Check SMTP settings in dashboard

### **Issue 3: Email Provider Blocking**
- **Gmail**: Usually works well
- **Yahoo**: Sometimes blocks automated emails
- **Outlook**: May block Supabase emails
- **Solution**: Try with Gmail first

## 🧪 **Quick Test:**

### **Test with Gmail:**
1. Use a Gmail address for testing
2. Check both inbox and spam folder
3. Wait 2-3 minutes for email delivery

### **Test with Different Email:**
1. Try with a different email provider
2. Use a simple email address (no special characters)
3. Make sure email address is valid

## 📋 **What to Check:**

- [ ] Email in spam folder
- [ ] Supabase email settings enabled
- [ ] Email templates configured
- [ ] Not hit daily/monthly limits
- [ ] Using valid email address
- [ ] Waiting 2-3 minutes for delivery
