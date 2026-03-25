# Admin Setup Instructions

## Security Changes

The admin system now requires **pre-approved email addresses** to create admin accounts. This prevents unauthorized users from accessing your restaurant's data.

## How It Works

1. **Admin link is hidden** - Customers cannot see the admin link anywhere on the website
2. **Direct URL access only** - Admins must go directly to: `https://your-website.com/admin`
3. **Pre-approved emails only** - Only email addresses in the `approved_admins` table can create accounts

## Adding Your First Admin Email

Before anyone can create an admin account, you need to add your email to the approved list:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on "Table Editor" in the left sidebar
4. Select the `approved_admins` table
5. Click "Insert" → "Insert row"
6. Fill in:
   - **email**: Your email address (lowercase)
   - **is_active**: `true`
   - Leave other fields as default
7. Click "Save"

### Option 2: Via SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Paste this SQL (replace with your email):

```sql
INSERT INTO approved_admins (email, is_active)
VALUES ('your-email@example.com', true);
```

5. Click "Run"

## Creating Your Admin Account

Once your email is in the approved list:

1. Go to: `https://your-website.com/admin`
2. Click "Create Admin Account" (only shows if no accounts exist)
3. Enter your pre-approved email
4. Create a password
5. Click "Create Admin Account"

If your email is not approved, you'll see an error message.

## Adding Additional Admins

After you've created your first admin account and logged in:

1. You can add more approved emails through the admin dashboard
2. Or manually add them via Supabase Dashboard using the same process above
3. New admins will then be able to create their accounts

## Security Notes

- Only pre-approved emails can create admin accounts
- The admin link is not visible to customers
- Admins must know the direct URL (`/admin`) to access the login page
- All customer data (orders, applications, reviews) is protected by Row Level Security
- Only authenticated admins can view customer data

## Recommended Email Addresses to Add

1. Your personal email
2. Restaurant owner's email
3. Any trusted manager's email

## Troubleshooting

**Error: "This email is not approved for admin access"**
- Make sure the email is added to the `approved_admins` table
- Check that `is_active` is set to `true`
- Verify the email is entered in lowercase
- Wait a few seconds and try again

**Can't find the admin login**
- Go directly to: `https://your-website.com/admin`
- The link is intentionally hidden from customers
