export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string
          email: string
          created_at: string
          updated_at: string
          is_active: boolean
          preferences: any
        }
        Insert: {
          id: string
          full_name?: string | null
          username: string
          email: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          preferences?: any
        }
        Update: {
          id?: string
          full_name?: string | null
          username?: string
          email?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          preferences?: any
        }
      }
      user_wallets: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          wallet_name: string | null
          wallet_type: string
          is_primary: boolean
          is_verified: boolean
          verification_signature: string | null
          connection_timestamp: string
          last_activity: string
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_address: string
          wallet_name?: string | null
          wallet_type: string
          is_primary?: boolean
          is_verified?: boolean
          verification_signature?: string | null
          connection_timestamp?: string
          last_activity?: string
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_address?: string
          wallet_name?: string | null
          wallet_type?: string
          is_primary?: boolean
          is_verified?: boolean
          verification_signature?: string | null
          connection_timestamp?: string
          last_activity?: string
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          transaction_hash: string
          block_number: number | null
          from_address: string
          to_address: string
          value: string | null
          gas_used: number | null
          gas_price: string | null
          transaction_fee: string | null
          token_symbol: string | null
          token_address: string | null
          transaction_type: string | null
          status: string | null
          timestamp: string | null
          category: string | null
          tags: string[] | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          transaction_hash: string
          block_number?: number | null
          from_address: string
          to_address: string
          value?: string | null
          gas_used?: number | null
          gas_price?: string | null
          transaction_fee?: string | null
          token_symbol?: string | null
          token_address?: string | null
          transaction_type?: string | null
          status?: string | null
          timestamp?: string | null
          category?: string | null
          tags?: string[] | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          transaction_hash?: string
          block_number?: number | null
          from_address?: string
          to_address?: string
          value?: string | null
          gas_used?: number | null
          gas_price?: string | null
          transaction_fee?: string | null
          token_symbol?: string | null
          token_address?: string | null
          transaction_type?: string | null
          status?: string | null
          timestamp?: string | null
          category?: string | null
          tags?: string[] | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      wallet_balances: {
        Row: {
          id: string
          wallet_id: string
          token_symbol: string
          token_address: string | null
          balance: string
          usd_value: string | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          token_symbol: string
          token_address?: string | null
          balance: string
          usd_value?: string | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          token_symbol?: string
          token_address?: string | null
          balance?: string
          usd_value?: string | null
          last_updated?: string
          created_at?: string
        }
      }
      login_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string | null
          ip_address: string | null
          user_agent: string | null
          device_fingerprint: string | null
          location_data: any
          login_timestamp: string
          logout_timestamp: string | null
          is_active: boolean
          suspicious_activity: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_fingerprint?: string | null
          location_data?: any
          login_timestamp?: string
          logout_timestamp?: string | null
          is_active?: boolean
          suspicious_activity?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_fingerprint?: string | null
          location_data?: any
          login_timestamp?: string
          logout_timestamp?: string | null
          is_active?: boolean
          suspicious_activity?: boolean
          created_at?: string
        }
      }
      security_alerts: {
        Row: {
          id: string
          user_id: string
          alert_type: string
          severity: string | null
          title: string
          description: string | null
          metadata: any
          is_read: boolean
          is_resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alert_type: string
          severity?: string | null
          title: string
          description?: string | null
          metadata?: any
          is_read?: boolean
          is_resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          alert_type?: string
          severity?: string | null
          title?: string
          description?: string | null
          metadata?: any
          is_read?: boolean
          is_resolved?: boolean
          created_at?: string
        }
      }
    }
  }
}
