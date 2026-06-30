export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      clients: {
        Row: {
          id: number;
          user_id: string;
          full_name: string;
          document_type: string;
          document_number: string;
          phone: string;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          full_name: string;
          document_type?: string;
          document_number: string;
          phone: string;
          address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      vehicles: {
        Row: {
          id: number;
          brand: string;
          model: string;
          vehicle_price: number;
          currency_type: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          brand: string;
          model: string;
          vehicle_price: number;
          currency_type: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      loans: {
        Row: {
          id: string;
          external_code: string;
          user_id: string;
          client_id: number | null;
          vehicle_id: number;
          initial_payment_amount: number;
          financed_amount: number;
          total_vehicle_price: number;
          annual_interest_rate: number;
          interest_rate_type: string;
          capitalization_period: string | null;
          payment_frequency: string;
          loan_term_in_months: number;
          number_of_grace_periods: number;
          grace_period_type: string;
          residual_value_amount: number;
          discount_rate: number;
          start_date: string;
          status: string;
          currency_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_code: string;
          user_id: string;
          client_id?: number | null;
          vehicle_id: number;
          initial_payment_amount: number;
          financed_amount: number;
          total_vehicle_price: number;
          annual_interest_rate: number;
          interest_rate_type: string;
          capitalization_period?: string | null;
          payment_frequency: string;
          loan_term_in_months: number;
          number_of_grace_periods?: number;
          grace_period_type?: string;
          residual_value_amount?: number;
          discount_rate: number;
          start_date: string;
          status?: string;
          currency_type: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['loans']['Insert']>;
      };
      payment_schedule: {
        Row: {
          id: number;
          loan_id: string;
          installment_number: number;
          due_date: string;
          grace_type: string;
          initial_balance: number;
          interest: number;
          amortization: number;
          installment_amount: number;
          residual_paid: number;
          final_balance: number;
          debtor_flow: number;
          present_value: number;
        };
        Insert: {
          id?: number;
          loan_id: string;
          installment_number: number;
          due_date: string;
          grace_type: string;
          initial_balance: number;
          interest: number;
          amortization: number;
          installment_amount: number;
          residual_paid?: number;
          final_balance: number;
          debtor_flow: number;
          present_value: number;
        };
        Update: Partial<Database['public']['Tables']['payment_schedule']['Insert']>;
      };
      financial_indicators: {
        Row: {
          id: number;
          loan_id: string;
          financed_amount: number;
          tea: number;
          periodic_rate: number;
          discount_rate_periodic: number;
          num_periods: number;
          total_interest: number;
          total_paid: number;
          van: number;
          tir_periodic: number;
          tir_annual: number;
          tcea: number;
          french_installment: number;
          residual_value: number;
          calculation_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          loan_id: string;
          financed_amount: number;
          tea: number;
          periodic_rate: number;
          discount_rate_periodic: number;
          num_periods: number;
          total_interest: number;
          total_paid: number;
          van: number;
          tir_periodic: number;
          tir_annual: number;
          tcea: number;
          french_installment: number;
          residual_value?: number;
          calculation_snapshot?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['financial_indicators']['Insert']>;
      };
      app_settings: {
        Row: {
          id: number;
          user_id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          channel: string;
          title: string;
          body: string;
          category: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          channel: string;
          title: string;
          body: string;
          category?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
