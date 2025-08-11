# 🔧 CORS Issue Fix Guide

## 🚨 **Current Issue:**
The login is timing out because of a CORS (Cross-Origin Resource Sharing) issue. Supabase is blocking requests from your localhost development server.

## ✅ **Quick Fix Steps:**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Sign in to your account
- Select your project: `riqsgtuzccwpplbodwbd`

### **2. Navigate to Authentication Settings**
- Go to **Authentication** → **Settings**
- Scroll down to **URL Configuration**

### **3. Add Localhost URLs**
Add these URLs to the **Site URL** field:
```
http://localhost:8080
http://localhost:8081
http://localhost:8082
http://localhost:8083
http://localhost:8084
http://localhost:3000
http://localhost:5173
```

### **4. Add Redirect URLs**
In the **Redirect URLs** section, add:
```
http://localhost:8080/**
http://localhost:8081/**
http://localhost:8082/**
http://localhost:8083/**
http://localhost:8084/**
http://localhost:3000/**
http://localhost:5173/**
```

### **5. Save Changes**
- Click **Save** at the bottom
- Wait a few minutes for changes to propagate

## 🧪 **Test the Fix:**

1. **Try the login again** in your app
2. **Check the console** - should see successful connection
3. **If still failing**, try a different port

## 🔍 **Alternative Solutions:**

### **Option A: Use a Different Port**
If CORS still fails, try running on a standard port:
```bash
# Kill all dev servers first
pkill -f "npm run dev"

# Then start fresh
npm run dev
```

### **Option B: Use Production URL**
If you have a deployed version, test there instead of localhost.

### **Option C: Disable CORS (Development Only)**
Add this to your Vite config (NOT recommended for production):
```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/auth': {
        target: 'https://riqsgtuzccwpplbodwbd.supabase.co',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
```

## 📞 **Need Help?**
If the issue persists after following these steps, the problem might be:
1. **Supabase project configuration**
2. **Network/firewall blocking**
3. **Browser security settings**

Try the HTML test file (`supabase-test.html`) to isolate the issue.
