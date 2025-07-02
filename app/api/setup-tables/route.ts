import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = []

    // Create user_profiles table
    const { error: profilesError } = await supabaseAdmin.sql`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          full_name TEXT,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT TRUE,
          preferences JSONB DEFAULT '{}'::jsonb
      );
    `

    if (profilesError) {
      console.log('User profiles creation result:', profilesError)
    }
    results.push('user_profiles table created')

    // Create user_wallets table
    const { error: walletsError } = await supabaseAdmin.sql`
      CREATE TABLE IF NOT EXISTS public.user_wallets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          wallet_address TEXT NOT NULL,
          wallet_name TEXT,
          wallet_type TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT FALSE,
          is_verified BOOLEAN DEFAULT FALSE,
          verification_signature TEXT,
          connection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb,
          balance_eth TEXT DEFAULT '0.0',
          balance_usd TEXT DEFAULT '0.00',
          chain_id INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, wallet_address)
      );
    `

    if (walletsError) {
      console.log('User wallets creation result:', walletsError)
    }
    results.push('user_wallets table created')

    // Create indexes
    const { error: indexError } = await supabaseAdmin.sql`
      CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON public.user_wallets(wallet_address);
    `

    if (indexError) {
      console.log('Indexes creation result:', indexError)
    }
    results.push('indexes created')

    // Enable RLS
    const { error: rlsError } = await supabaseAdmin.sql`
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
    `

    if (rlsError) {
      console.log('RLS enable result:', rlsError)
    }
    results.push('RLS enabled')

    // Create policies
    const { error: policiesError } = await supabaseAdmin.sql`
      -- User profiles policies
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.user_profiles
          FOR SELECT USING (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.user_profiles
          FOR INSERT WITH CHECK (auth.uid() = id);

      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
          FOR UPDATE USING (auth.uid() = id);

      -- User wallets policies
      CREATE POLICY IF NOT EXISTS "Users can view own wallets" ON public.user_wallets
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert own wallets" ON public.user_wallets
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update own wallets" ON public.user_wallets
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete own wallets" ON public.user_wallets
          FOR DELETE USING (auth.uid() = user_id);
    `

    if (policiesError) {
      console.log('Policies creation result:', policiesError)
    }
    results.push('policies created')

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      results
    })

  } catch (error) {
    console.error('Setup tables error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup database tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
