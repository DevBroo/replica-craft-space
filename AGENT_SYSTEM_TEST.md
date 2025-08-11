# 🏢 AGENT SYSTEM TEST GUIDE

## **Test Environment:**
- **Agent Signup**: `http://localhost:8080/agent/signup`
- **Agent Login**: `http://localhost:8080/agent/login`
- **Agent Dashboard**: `http://localhost:8080/agent/dashboard`
- **Add Property**: `http://localhost:8080/agent/add-property`

---

## **🧪 TEST 1: Agent Registration**

### **1.1 Agent Signup Form**
- [ ] **Navigate to**: `http://localhost:8080/agent/signup`
- [ ] **Form loads** correctly with all sections
- [ ] **Personal Information** section shows:
  - First Name field
  - Last Name field
  - Email field
  - Phone field
- [ ] **Business Information** section shows:
  - Company Name field
  - License Number field
  - Business Address field
  - City, State, Pincode fields
- [ ] **Security** section shows:
  - Password field
  - Confirm Password field
- [ ] **Form validation** works for all required fields

### **1.2 Agent Signup Process**
- [ ] **Fill all required fields** with valid data
- [ ] **Click "Create Agent Account"** button
- [ ] **Loading state** shows (spinner/disabled button)
- [ ] **Success message** appears
- [ ] **Redirects to agent login** after 3 seconds
- [ ] **Email is pre-filled** in login form

### **1.3 Agent Signup Error Handling**
- [ ] **Empty fields**: Shows validation errors
- [ ] **Invalid email**: Shows error message
- [ ] **Password mismatch**: Shows error message
- [ ] **Weak password**: Shows validation error

---

## **🧪 TEST 2: Agent Login**

### **2.1 Agent Login Form**
- [ ] **Navigate to**: `http://localhost:8080/agent/login`
- [ ] **Form loads** correctly
- [ ] **Email field** is pre-filled (if coming from signup)
- [ ] **Password field** is empty
- [ ] **"Sign In"** button is present
- [ ] **Links to signup** and customer login are present

### **2.2 Agent Login Process**
- [ ] **Enter agent credentials** (email/password)
- [ ] **Click "Sign In"** button
- [ ] **Loading state** shows
- [ ] **Success**: Redirects to agent dashboard
- [ ] **Dashboard shows** agent-specific content

### **2.3 Agent Login Error Handling**
- [ ] **Wrong credentials**: Shows error message
- [ ] **Empty fields**: Shows validation errors
- [ ] **Invalid email format**: Shows error message

### **2.4 Role-Based Access**
- [ ] **Customer account** tries to access agent login
- [ ] **Should redirect** to customer login
- [ ] **Agent account** can access agent dashboard
- [ ] **Non-authenticated user** is redirected to agent login

---

## **🧪 TEST 3: Agent Dashboard**

### **3.1 Dashboard Access**
- [ ] **Authenticated agent** can access dashboard
- [ ] **Non-authenticated user** is redirected to login
- [ ] **Customer account** is redirected to customer login

### **3.2 Dashboard Content**
- [ ] **Header shows** agent portal branding
- [ ] **User profile** shows agent email and avatar
- [ ] **Logout button** is functional
- [ ] **Welcome message** is personalized

### **3.3 Dashboard Statistics**
- [ ] **Total Properties** card shows correct count
- [ ] **Active Bookings** card shows correct count
- [ ] **Total Earnings** card shows formatted amount
- [ ] **Pending Approvals** card shows correct count

### **3.4 Quick Actions**
- [ ] **"Add New Property"** button is present
- [ ] **"View Bookings"** button is present
- [ ] **"Account Settings"** button is present
- [ ] **Buttons are properly styled** and clickable

### **3.5 Recent Properties Section**
- [ ] **Shows list** of recent properties
- [ ] **Each property shows**:
  - Property name
  - Location
  - Rating
  - Number of bookings
  - Status badge
  - Price per night
- [ ] **Status badges** are color-coded correctly

### **3.6 Recent Bookings Section**
- [ ] **Shows list** of recent bookings
- [ ] **Each booking shows**:
  - Property name
  - Guest name
  - Check-in/Check-out dates
  - Amount
  - Status badge
- [ ] **Status badges** are color-coded correctly

---

## **🧪 TEST 4: Property Management**

### **4.1 Add Property Access**
- [ ] **Click "Add New Property"** from dashboard
- [ ] **Redirects to**: `/agent/add-property`
- [ ] **Non-authenticated user** is redirected to login
- [ ] **Customer account** is redirected to customer login

### **4.2 Add Property Form**
- [ ] **Form loads** with all sections:
  - Basic Information
  - Location
  - Pricing & Capacity
  - Amenities
  - Property Images
- [ ] **All required fields** are marked with asterisk
- [ ] **Form validation** works for all fields

### **4.3 Basic Information Section**
- [ ] **Property Name** field accepts text input
- [ ] **Property Type** dropdown shows options:
  - Villa
  - Apartment
  - Cottage
  - Resort
  - Farmhouse
  - Homestay
- [ ] **Description** textarea accepts long text

### **4.4 Location Section**
- [ ] **Address** field accepts full address
- [ ] **City, State, Pincode** fields work correctly
- [ ] **All fields** are required

### **4.5 Pricing & Capacity Section**
- [ ] **Price per Night** field accepts numbers
- [ ] **Max Guests** field accepts numbers
- [ ] **Bedrooms** field accepts numbers
- [ ] **Bathrooms** field accepts numbers
- [ ] **All fields** are required

### **4.6 Amenities Section**
- [ ] **Checkboxes** for common amenities:
  - WiFi
  - Parking
  - Kitchen
  - Air Conditioning
  - Swimming Pool
  - Garden
  - TV
  - Heating
- [ ] **Checkboxes** can be toggled on/off
- [ ] **Selected amenities** are tracked correctly

### **4.7 Image Upload**
- [ ] **File input** accepts multiple images
- [ ] **File type restriction** to images only
- [ ] **Preview** shows uploaded images
- [ ] **Multiple files** can be selected

### **4.8 Form Submission**
- [ ] **Fill all required fields** with valid data
- [ ] **Click "Add Property"** button
- [ ] **Loading state** shows
- [ ] **Success message** appears
- [ ] **Redirects to dashboard** after 2 seconds

### **4.9 Form Validation**
- [ ] **Empty required fields**: Shows error message
- [ ] **Invalid data types**: Shows validation errors
- [ ] **Form prevents submission** until valid

---

## **🧪 TEST 5: Navigation & Routing**

### **5.1 Portal Navigation**
- [ ] **Main site navigation** shows "Travel Agent Portal" link
- [ ] **Link points to**: `/agent/login`
- [ ] **Mobile menu** also shows agent portal link
- [ ] **Link works** from all pages

### **5.2 Agent Portal Navigation**
- [ ] **Dashboard** has back button to main site
- [ ] **Add Property** has back button to dashboard
- [ ] **All navigation** works correctly
- [ ] **Breadcrumbs** or navigation context is clear

### **5.3 Authentication Flow**
- [ ] **Unauthenticated access** to protected routes redirects to login
- [ ] **Wrong role access** redirects to appropriate login
- [ ] **Authenticated access** shows correct content
- [ ] **Logout** clears session and redirects to login

---

## **🧪 TEST 6: UI/UX Testing**

### **6.1 Responsive Design**
- [ ] **Desktop view** shows all elements properly
- [ ] **Tablet view** adapts layout correctly
- [ ] **Mobile view** is usable and accessible
- [ ] **Form fields** are properly sized on all devices

### **6.2 Visual Design**
- [ ] **Brand colors** are consistent (orange/red gradient)
- [ ] **Typography** is readable and consistent
- [ ] **Icons** are appropriate and visible
- [ ] **Spacing** and layout are professional

### **6.3 User Experience**
- [ ] **Loading states** provide feedback
- [ ] **Error messages** are clear and helpful
- [ ] **Success messages** confirm actions
- [ ] **Form validation** is immediate and clear

---

## **✅ EXPECTED RESULTS:**

### **Agent Signup:**
- Professional form with business-focused fields
- Comprehensive validation
- Clear success flow to login

### **Agent Login:**
- Simple, focused login form
- Role-based access control
- Proper error handling

### **Agent Dashboard:**
- Business-focused dashboard with key metrics
- Quick access to common actions
- Recent activity overview

### **Add Property:**
- Comprehensive property listing form
- Multiple sections for different property aspects
- Image upload capability
- Professional validation and feedback

---

## **🚨 COMMON ISSUES TO CHECK:**

1. **Role-based access** not working properly
2. **Form validation** missing or incorrect
3. **Navigation** between agent pages broken
4. **Authentication state** not persisting
5. **Image upload** not working
6. **Responsive design** issues on mobile
7. **Error handling** not user-friendly
8. **Loading states** missing or unclear

---

## **📝 TEST SCENARIOS:**

### **Scenario 1: New Agent Registration**
1. Go to agent signup
2. Fill all required fields
3. Submit form
4. Verify success and redirect to login
5. Login with new credentials
6. Access dashboard and add property

### **Scenario 2: Existing Agent Login**
1. Go to agent login
2. Enter valid credentials
3. Access dashboard
4. Navigate to add property
5. Fill property form
6. Submit and verify success

### **Scenario 3: Access Control**
1. Try to access agent dashboard without login
2. Try to access with customer account
3. Verify proper redirects
4. Test logout functionality

### **Scenario 4: Property Management**
1. Login as agent
2. Add a new property
3. Verify form validation
4. Test image upload
5. Submit and verify success

**Run through these comprehensive tests to ensure the agent system works perfectly!**
