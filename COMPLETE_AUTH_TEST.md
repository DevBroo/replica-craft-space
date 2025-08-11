# 🔐 COMPLETE AUTHENTICATION UI TEST GUIDE

## **Test Environment:**
- **App URL**: `http://localhost:8080`
- **Login URL**: `http://localhost:8080/login`
- **Test User**: `mshimavarsha07@gmail.com` / `Alliance@8`

---

## **🧪 TEST 1: Initial State (Not Logged In)**

### **1.1 Home Page (`/`)**
- [ ] **Header shows**: "Login" and "Sign Up" buttons
- [ ] **No user profile** visible
- [ ] **Navigation works**: All links functional

### **1.2 Properties Page (`/properties`)**
- [ ] **Header shows**: "Login" and "Sign Up" buttons
- [ ] **No user profile** visible
- [ ] **Navigation works**: All links functional

### **1.3 Login Page (`/login`)**
- [ ] **Form loads** correctly
- [ ] **Email field** pre-filled (if coming from signup)
- [ ] **Password field** empty
- [ ] **Toggle between Email/Phone** works
- [ ] **Form validation** works (empty fields show errors)

---

## **🧪 TEST 2: Login Process**

### **2.1 Login Form Submission**
- [ ] **Enter credentials**: `mshimavarsha07@gmail.com` / `Alliance@8`
- [ ] **Click "Sign In"** button
- [ ] **Loading state** shows (spinner/disabled button)
- [ ] **No error message** appears
- [ ] **Success**: Redirects to home page (`/`)

### **2.2 Login Error Handling**
- [ ] **Wrong password**: Shows error message
- [ ] **Invalid email**: Shows error message
- [ ] **Empty fields**: Shows validation errors
- [ ] **Network error**: Shows appropriate error message

---

## **🧪 TEST 3: Post-Login State**

### **3.1 Home Page After Login**
- [ ] **Header shows**: User avatar (first letter of email)
- [ ] **Header shows**: User email (on larger screens)
- [ ] **Header shows**: "Logout" button
- [ ] **No "Login" or "Sign Up"** buttons visible
- [ ] **User stays on home page** (not redirected away)

### **3.2 Properties Page After Login**
- [ ] **Header shows**: User avatar (first letter of email)
- [ ] **Header shows**: User email (on larger screens)
- [ ] **Header shows**: "Logout" button
- [ ] **No "Login" or "Sign Up"** buttons visible
- [ ] **User can browse properties** normally

### **3.3 Mobile Menu After Login**
- [ ] **Open mobile menu** (hamburger button)
- [ ] **Shows user profile** with avatar and email
- [ ] **Shows "Logout"** button
- [ ] **No "Login" or "Sign Up"** buttons visible

---

## **🧪 TEST 4: Logout Process**

### **4.1 Desktop Logout**
- [ ] **Click "Logout"** button in header
- [ ] **User is signed out** immediately
- [ ] **Header reverts** to showing "Login" and "Sign Up"
- [ ] **User stays on current page** (no redirect)

### **4.2 Mobile Logout**
- [ ] **Open mobile menu**
- [ ] **Click "Logout"** button
- [ ] **Menu closes** automatically
- [ ] **User is signed out** immediately
- [ ] **Header reverts** to showing "Login" and "Sign Up"

---

## **🧪 TEST 5: Session Persistence**

### **5.1 Page Refresh**
- [ ] **Login successfully**
- [ ] **Refresh the page** (F5 or Cmd+R)
- [ ] **User remains logged in**
- [ ] **Header still shows** user profile and logout button

### **5.2 Browser Tab Switch**
- [ ] **Login successfully**
- [ ] **Open new tab** to same site
- [ ] **User remains logged in** on new tab
- [ ] **Header shows** user profile on new tab

---

## **🧪 TEST 6: Navigation After Login**

### **6.1 Protected Routes**
- [ ] **Try to access** `/login` while logged in
- [ ] **Should redirect** to home page automatically
- [ ] **No login form** should be visible

### **6.2 Public Routes**
- [ ] **Navigate to** `/properties` while logged in
- [ ] **Should work normally** with user profile visible
- [ ] **Navigate to** `/about` while logged in
- [ ] **Should work normally** with user profile visible

---

## **🧪 TEST 7: UI Responsiveness**

### **7.1 Desktop View**
- [ ] **User avatar** visible and properly sized
- [ ] **User email** visible on large screens
- [ ] **Logout button** properly styled and positioned

### **7.2 Tablet View**
- [ ] **User avatar** visible
- [ ] **User email** may be hidden (responsive design)
- [ ] **Logout button** accessible

### **7.3 Mobile View**
- [ ] **User avatar** visible in mobile menu
- [ ] **User email** visible in mobile menu
- [ ] **Logout button** accessible in mobile menu

---

## **🧪 TEST 8: Error Scenarios**

### **8.1 Invalid Login**
- [ ] **Try wrong password**: Should show error message
- [ ] **Try invalid email**: Should show error message
- [ ] **Try empty fields**: Should show validation errors
- [ ] **Error messages** should be clear and helpful

### **8.2 Network Issues**
- [ ] **Disconnect internet** and try to login
- [ ] **Should show** appropriate network error message
- [ ] **Reconnect internet** and try again
- [ ] **Should work** normally

---

## **✅ EXPECTED RESULTS:**

### **Before Login:**
- Login/Signup buttons visible
- No user profile visible
- Clean, professional appearance

### **After Login:**
- User avatar (first letter of email) visible
- User email visible (on larger screens)
- Logout button visible
- No login/signup buttons visible
- Seamless user experience

### **After Logout:**
- Back to initial state
- Login/Signup buttons visible
- No user profile visible
- Clean transition

---

## **🚨 COMMON ISSUES TO CHECK:**

1. **Login button not disappearing** after successful login
2. **User profile not showing** after login
3. **Logout not working** properly
4. **Session not persisting** on page refresh
5. **Mobile menu not updating** after login/logout
6. **Navigation issues** after authentication state changes

---

## **📝 TEST NOTES:**

- **Test on multiple browsers** (Chrome, Safari, Firefox)
- **Test on multiple devices** (desktop, tablet, mobile)
- **Test with different screen sizes** (responsive design)
- **Test with slow network** (loading states)
- **Test with network errors** (error handling)

**Run through this complete test to ensure the authentication UI is working perfectly!**
