# Real-Time Live Update Fix Guide

## 🐛 Problem Analysis

The real-time live updates are not working due to a **role format mismatch**. You mentioned that real-time worked when you used `user_metadata.role: "admin"` but doesn't work with `app_metadata.role: "super-admin"`.

### User Data Analysis
Your user has:
- ✅ `raw_app_meta_data.role: "super-admin"` (current)
- ❌ `raw_user_meta_data.role: null` (removed, but was working before)

### The Issue
The real-time functionality and RLS policies were originally configured to work with `user_metadata.role: "admin"`, but the current setup only checks for `app_metadata.role: "super-admin"`.

## 🔧 Solutions

### Solution 1: Restore Working Role (Quick Fix)

Run this SQL to restore the working `user_metadata.role: "admin"`:

```sql
-- Restore the working user_metadata role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'angelo.visan@gmail.com';
```

### Solution 2: Update RLS Policies for Compatibility

Run `fix_rls_policies_compatibility.sql` to support both role formats:

```sql
-- This updates RLS policies to accept both 'admin' and 'super-admin' roles
-- from both app_metadata and user_metadata
```

### Solution 3: Code-Level Compatibility (Already Applied)

I've updated the auth hook to support both role formats:

```typescript
// Now supports both 'admin' and 'super-admin' roles
const isAdmin = appMetadataRole === 'super-admin' || 
               appMetadataRole === 'admin' || 
               userMetadataRole === 'admin' || 
               userMetadataRole === 'super-admin'
```

## 🚀 Recommended Approach

### Step 1: Apply the Quick Fix
```sql
-- Run this in your Supabase SQL editor
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'angelo.visan@gmail.com';
```

### Step 2: Update RLS Policies
Run the `fix_rls_policies_compatibility.sql` file to ensure both role formats work.

### Step 3: Sign Out and Sign Back In
This ensures the session is refreshed with the corrected metadata.

### Step 4: Test Real-Time Updates
- Look for the `LIVE` badge in the dashboard
- Make changes and verify they appear instantly
- Check console logs for success messages

## 🔍 Debugging

### Check Console Logs

After applying the fixes, you should see:

```
🔍 User role check: {
  appMetadataRole: "super-admin",
  userMetadataRole: "admin",  // Should be "admin" after fix
  isAdmin: true,
  hasSession: true,
  hasAccessToken: true
}

🔄 Setting up real-time with auth state: {
  isAuthenticated: true,
  isAdmin: true,
  hasSession: true,
  hasAccessToken: true
}

✅ Real-time connection established successfully
```

### Expected Behavior

After the fix, you should see:
- ✅ `LIVE` badge instead of `POLLING`
- ✅ Real-time updates when data changes
- ✅ Console logs showing successful subscriptions
- ✅ No more role format conflicts

## 🛡️ Long-term Solution

For future-proofing, I recommend:

### 1. Standardize on One Role Format
Choose either:
- **Option A**: Use `app_metadata.role: "admin"` everywhere
- **Option B**: Use `user_metadata.role: "admin"` everywhere

### 2. Update All RLS Policies
Ensure all policies use the same role format consistently.

### 3. Update Code Logic
Standardize the role checking logic to use only one source.

## 🔄 Alternative: Force Real-Time Mode

If you want to temporarily bypass the role check for testing:

```typescript
// In use-live-dashboard-data.ts, temporarily modify:
// Change from:
if (!isAuthenticated || !isAdmin || !session) {

// To:
if (!isAuthenticated || !session) { // Remove isAdmin check temporarily
```

**⚠️ Warning**: Only use this for testing, not in production!

## 📞 Support

If the issue persists after applying these fixes:

1. **Check console logs** for specific error messages
2. **Verify RLS policies** are correctly configured
3. **Test with a fresh user** to isolate the issue
4. **Check Supabase real-time logs** in the dashboard

## 🎯 Expected Result

After applying the fix, your real-time updates should work perfectly:

- ✅ Instant updates when data changes
- ✅ `LIVE` status indicator
- ✅ No more polling fallback
- ✅ Proper error handling and logging
- ✅ Role format compatibility 