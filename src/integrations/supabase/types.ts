export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_events: {
        Row: {
          available_starting_date: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          reason: string
          sauna_type_id: string
        }
        Insert: {
          available_starting_date: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity: number
          reason: string
          sauna_type_id: string
        }
        Update: {
          available_starting_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          reason?: string
          sauna_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_events_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "sauna_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          access_notes: string | null
          admin_notes: string | null
          consult_status: string
          contract_status: string
          created_at: string
          email: string
          first_name: string
          id: string
          id_status: string
          install_address: string
          last_name: string
          min_commitment_months: number
          payment_status: string
          phone: string
          placement_choice: string
          preferred_install_at: string
          reservation_status: string
          sauna_type_id: string
        }
        Insert: {
          access_notes?: string | null
          admin_notes?: string | null
          consult_status?: string
          contract_status?: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          id_status?: string
          install_address: string
          last_name: string
          min_commitment_months: number
          payment_status?: string
          phone: string
          placement_choice: string
          preferred_install_at: string
          reservation_status?: string
          sauna_type_id: string
        }
        Update: {
          access_notes?: string | null
          admin_notes?: string | null
          consult_status?: string
          contract_status?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          id_status?: string
          install_address?: string
          last_name?: string
          min_commitment_months?: number
          payment_status?: string
          phone?: string
          placement_choice?: string
          preferred_install_at?: string
          reservation_status?: string
          sauna_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "sauna_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sauna_types: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          placement: string
          reservation_fee_cents: number
          sort_order: number
          stripe_payment_link: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          name: string
          placement: string
          reservation_fee_cents: number
          sort_order?: number
          stripe_payment_link: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          placement?: string
          reservation_fee_cents?: number
          sort_order?: number
          stripe_payment_link?: string
        }
        Relationships: []
      }
    }
    Views: {
      paid_reservation_consumption: {
        Row: {
          preferred_install_date: string | null
          sauna_type_id: string | null
        }
        Insert: {
          preferred_install_date?: never
          sauna_type_id?: string | null
        }
        Update: {
          preferred_install_date?: never
          sauna_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "sauna_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
