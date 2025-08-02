# Supabase Setup Guide for Berrymart

This guide will help you set up Supabase for your Berrymart project.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `berrymart` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **Project API Keys** → **anon public**

## Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Run the Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and paste it into the editor
4. Click **Run** to execute the schema
5. Verify that all tables were created successfully

## Step 5: Set Up Row Level Security

1. In the **SQL Editor**, create a new query
2. Copy the contents of `supabase-rls-policies.sql` and paste it
3. Click **Run** to execute the RLS policies
4. Verify that policies were created successfully

## Step 6: Create Your First Admin User

Since we're using custom user management, you'll need to create your first admin user:

1. In the **SQL Editor**, run this query (replace with your details):

```sql
-- First, create an auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@berrymart.com',
  crypt('your-password-here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Then create the user record in our users table
INSERT INTO users (email, first_name, last_name, role, is_active)
VALUES ('admin@berrymart.com', 'Admin', 'User', 'Admin', true);
```

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try to log in with your admin credentials
3. Verify that you can:
   - View the dashboard
   - Navigate between pages
   - See that you're authenticated

## Step 8: Seed Sample Data (Optional)

You can add some sample data to test the system:

```sql
-- Insert sample customers
INSERT INTO customers (name, email, phone, type) VALUES
('John Doe', 'john@example.com', '+234-123-456-789', 'retail'),
('Jane Smith', 'jane@example.com', '+234-987-654-321', 'wholesale'),
('ABC Company', 'contact@abc.com', '+234-555-123-456', 'open_market');

-- Insert sample products
INSERT INTO products (name, description, sku, base_price, retail_price, wholesale_price, open_market_price, stock_quantity) VALUES
('Rice 50kg', 'Premium quality rice', 'RICE-50', 25000, 30000, 27000, 26000, 100),
('Beans 25kg', 'Organic beans', 'BEANS-25', 15000, 18000, 16500, 16000, 50),
('Oil 5L', 'Vegetable cooking oil', 'OIL-5L', 5000, 6000, 5500, 5300, 200);
```

## Step 9: Update Your Application Code

The Supabase services are ready to use:

- `supabaseAuth` - for authentication
- `supabaseDb` - for database operations

You can start updating your components to use these instead of the local services.

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check that your `.env.local` file has the correct variables
   - Restart your development server after changing env variables

2. **Authentication not working**
   - Verify your RLS policies are set up correctly
   - Check that the user exists in both `auth.users` and `users` tables

3. **Permission errors**
   - Check the RLS policies in your Supabase dashboard
   - Verify the user's role is set correctly

4. **Database connection issues**
   - Verify your project URL and API key are correct
   - Check your Supabase project is running

### Getting Help:

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the logs in your Supabase dashboard
- Check browser console for any client-side errors

## Next Steps

Once Supabase is set up and working:

1. Update components to use `supabaseAuth` and `supabaseDb`
2. Test all functionality works with the new backend
3. Add real-time subscriptions for live updates
4. Deploy your application

## Security Notes

- Never commit your `.env.local` file to version control
- Use Row Level Security policies to secure your data
- Regularly review and update your RLS policies
- Monitor your Supabase usage and logs
- Enable 2FA on your Supabase account