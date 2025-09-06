# 🧪 Review Flow Testing Guide

## Overview
This guide demonstrates the complete customer review flow from booking completion to review submission and property owner dashboard reflection.

## 🚀 Quick Test Setup

### Step 1: Create Test Data
Run the test data creation script:
```bash
node test-review-flow-demo.js
```

This creates:
- Test property owner (owner@test.com)
- Test property (Test Beach Villa)
- Test customer (customer@test.com)
- Completed booking
- Sample review

### Step 2: Test Customer Review Flow

#### 2.1 Login as Customer
1. Go to `http://localhost:8081/login`
2. Login with: `customer@test.com` / `password123`
3. Navigate to Customer Dashboard

#### 2.2 Submit Review
1. Click on "Reviews" tab in customer dashboard
2. You should see completed bookings eligible for review
3. Click "Write Review" button
4. Fill in rating (1-5 stars) and comment
5. Click "Submit Review"
6. Verify success message

### Step 3: Test Property Owner Dashboard

#### 3.1 Login as Property Owner
1. Go to `http://localhost:8081/owner/login`
2. Login with: `owner@test.com` / `password123`
3. Navigate to Owner Dashboard

#### 3.2 Check Reviews
1. Click on "Reviews" section
2. You should see the submitted review
3. Verify review details:
   - Guest name
   - Property name
   - Rating (stars)
   - Comment
   - Date
   - Status (Pending/Responded)

#### 3.3 Test Real-time Updates
1. Keep owner dashboard open
2. Submit another review as customer
3. Watch the review appear immediately in owner dashboard

## 🔍 Review System Components

### Customer Side
- **ReviewYourStay Component**: Shows eligible bookings
- **ReviewModal Component**: Review submission form
- **ReviewService**: Handles review operations

### Property Owner Side
- **Reviews Component**: Displays all reviews
- **OwnerService**: Fetches owner reviews
- **Real-time Subscriptions**: Live updates

## 📊 Database Structure

### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  property_id UUID REFERENCES properties(id),
  user_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name TEXT,
  response TEXT,
  response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  user_id UUID REFERENCES profiles(id),
  check_in_date DATE,
  check_out_date DATE,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount DECIMAL(10,2),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT
);
```

## 🧪 Test Scenarios

### Scenario 1: Happy Path
1. Customer completes booking
2. Customer submits 5-star review
3. Review appears in owner dashboard
4. Owner responds to review
5. Response appears in customer view

### Scenario 2: Edge Cases
1. Customer tries to review same booking twice
2. Customer tries to review before checkout
3. Owner tries to review their own property
4. Review with very long comment

### Scenario 3: Error Handling
1. Network failure during submission
2. Invalid rating (outside 1-5 range)
3. Missing required fields
4. Database connection issues

## 🔧 Troubleshooting

### Common Issues

#### 1. No Eligible Bookings
**Problem**: Customer doesn't see any bookings to review
**Solution**: 
- Check booking status is "completed"
- Verify check_out_date is in the past
- Ensure booking doesn't already have a review

#### 2. Review Not Appearing in Owner Dashboard
**Problem**: Review submitted but not visible to owner
**Solution**:
- Check property_id matches owner's property
- Verify real-time subscriptions are working
- Check browser console for errors

#### 3. Authentication Issues
**Problem**: User not authenticated for review submission
**Solution**:
- Verify user is logged in
- Check Supabase auth state
- Ensure proper RLS policies

## 📈 Performance Testing

### Load Testing
1. Submit multiple reviews simultaneously
2. Test with large number of reviews
3. Verify pagination works correctly
4. Check real-time update performance

### Database Performance
1. Monitor query execution time
2. Check index usage
3. Verify RLS policy performance
4. Test with large datasets

## 🎯 Success Criteria

### Customer Experience
- ✅ Can see completed bookings eligible for review
- ✅ Can submit reviews with rating and comment
- ✅ Receives confirmation of successful submission
- ✅ Can view their review history

### Property Owner Experience
- ✅ Can see all reviews for their properties
- ✅ Reviews appear in real-time
- ✅ Can respond to reviews
- ✅ Review statistics are accurate
- ✅ Can filter and search reviews

### System Performance
- ✅ Review submission is fast (< 2 seconds)
- ✅ Real-time updates work reliably
- ✅ No data loss or corruption
- ✅ Proper error handling and recovery

## 🚀 Next Steps

After successful testing:
1. Deploy to production environment
2. Monitor review submission rates
3. Track customer satisfaction metrics
4. Implement review analytics
5. Add review moderation features

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check database RLS policies
4. Review authentication state
5. Test with different user accounts
