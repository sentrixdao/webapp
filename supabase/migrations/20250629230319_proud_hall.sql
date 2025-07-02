/*
  # Update user profiles and wallet tables schema

  1. New Tables
     - No new tables are created
  2. Changes
     - Add username column to user_profiles
     - Update wallet service to use single wallet per user
     - Update RLS policies for proper access
  3. Security
     - Enable RLS on all tables
     - Add policies for authenticated users
*/

-- Update user_profiles table to add username field
ALTER TABLE IF EXISTS public.user_profiles 
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Make username not null for future records
ALTER TABLE public.user_profiles 
  ALTER COLUMN username SET NOT NULL;

-- Create a function to generate a username if missing
CREATE OR REPLACE FUNCTION generate_username() 
RETURNS TRIGGER AS $$
BEGIN
  -- If username is NULL, generate one from email or id
  IF NEW.username IS NULL THEN
    NEW.username := 
      CASE 
        WHEN NEW.email IS NOT NULL THEN 
          REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '')
        ELSE 
          'user_' || SUBSTRING(NEW.id::text, 1, 8)
      END;
  END IF;
  RETURN NEW;
END;
$$ language plpgsql;

-- Apply username generation trigger to existing table
DROP TRIGGER IF EXISTS generate_username_trigger ON public.user_profiles;

CREATE TRIGGER generate_username_trigger
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE generate_username();

-- Update existing records to add username where missing
UPDATE public.user_profiles
SET username = 
  CASE 
    WHEN email IS NOT NULL THEN 
      REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9]', '')
    ELSE 
      'user_' || SUBSTRING(id::text, 1, 8)
  END
WHERE username IS NULL;

-- Make sure wallet tables use "is_primary" field for enforcing single wallet model
CREATE OR REPLACE FUNCTION ensure_single_wallet_per_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete any other wallets for this user to ensure single wallet model
  -- This is intentionally aggressive to enforce the single wallet policy
  DELETE FROM public.user_wallets 
  WHERE user_id = NEW.user_id 
  AND id != NEW.id;
  
  -- Always set new wallet as primary
  NEW.is_primary := TRUE;
  
  RETURN NEW;
END;
$$ language plpgsql;

-- Apply single wallet enforcement
DROP TRIGGER IF EXISTS ensure_single_wallet_trigger ON public.user_wallets;

CREATE TRIGGER ensure_single_wallet_trigger
  BEFORE INSERT OR UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE PROCEDURE ensure_single_wallet_per_user();

-- Reinforce RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Ensure proper RLS policies exist for user_wallets
DROP POLICY IF EXISTS "Users can view own wallets" ON public.user_wallets;
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallets" ON public.user_wallets;
CREATE POLICY "Users can insert own wallets" ON public.user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallets" ON public.user_wallets;
CREATE POLICY "Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wallets" ON public.user_wallets;
CREATE POLICY "Users can delete own wallets" ON public.user_wallets
    FOR DELETE USING (auth.uid() = user_id);