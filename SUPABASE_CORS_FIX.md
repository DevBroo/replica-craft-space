# 🚨 URGENT: Complete CORS Fix for Supabase

## **Current Issue:**
Login is hanging because Supabase is blocking requests from `localhost:8080`. The CORS settings need to be updated with the exact URLs.

## **Step-by-Step Fix:**

### **1. Go to Supabase Dashboard**
- Open: https://supabase.com/dashboard
- Sign in to your account
- Click on project: `riqsgtuzccwpplbodwbd`

### **2. Navigate to Authentication Settings**
- Click **Authentication** in left sidebar
- Click **Settings** (gear icon)
- Scroll down to **URL Configuration**

### **3. Update Site URL**
In the **Site URL** field, make sure you have:
```
http://localhost:8080
```

### **4. Update Redirect URLs**
In the **Redirect URLs** section, add these EXACT URLs:
```
http://localhost:8080/**
http://localhost:8080/login
http://localhost:8080/signup
http://localhost:8080/reset-password
http://localhost:8080/forgot-password
```

### **5. Update Additional Redirect URLs**
Also add these for other ports (in case you switch):
```
http://localhost:8081/**
http://localhost:8082/**
http://localhost:8083/**
http://localhost:8084/**
http://localhost:3000/**
http://localhost:5173/**
```

### **6. Save and Wait**
- Click **Save** at the bottom
- **Wait 5-10 minutes** for changes to fully propagate
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

## **Alternative Quick Fix:**

If CORS is still blocking, try this temporary workaround:

### **Option A: Use Different Port**
```bash
# Kill all dev servers
pkill -f "npm run dev"

# Start on a standard port
npm run dev
```

### **Option B: Test with HTML File**
Open `simple-login-test.html` in your browser to test Supabase directly.

### **Option C: Check Supabase Project Status**
- Go to Supabase Dashboard
- Check if project is active and not paused
- Verify API keys are correct

## **Expected Results:**
After fixing CORS, you should see:
- `✅ Auth successful, loading profile...`
- Successful login and redirect to dashboard

## **If Still Failing:**
The issue might be:
1. **Browser cache** - Clear cache and try again
2. **Network restrictions** - Try different network
3. **Supabase project issues** - Check project status
4. **API key problems** - Verify keys are correct

**Try the HTML test first to isolate the issue!**
