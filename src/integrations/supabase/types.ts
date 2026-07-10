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
      agreement_versions: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          master_pdf_storage_path: string
          updated_at: string
          version_name: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          master_pdf_storage_path: string
          updated_at?: string
          version_name: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          master_pdf_storage_path?: string
          updated_at?: string
          version_name?: string
        }
        Relationships: []
      }
      contract_acknowledgments: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          acknowledgment_key: string
          acknowledgment_text: string
          contract_id: string
          created_at: string
          id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          acknowledgment_key: string
          acknowledgment_text: string
          contract_id: string
          created_at?: string
          id?: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          acknowledgment_key?: string
          acknowledgment_text?: string
          contract_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_acknowledgments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_events: {
        Row: {
          actor_type: string
          contract_id: string
          created_at: string
          event_details: Json
          event_type: string
          id: string
        }
        Insert: {
          actor_type?: string
          contract_id: string
          created_at?: string
          event_details?: Json
          event_type: string
          id?: string
        }
        Update: {
          actor_type?: string
          contract_id?: string
          created_at?: string
          event_details?: Json
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signature_audit: {
        Row: {
          agreement_version: string
          contract_id: string
          created_at: string
          electronic_consent_confirmed: boolean
          id: string
          ip_address: string | null
          reservation_id: string
          signed_at: string
          signed_pdf_hash: string
          time_zone: string | null
          typed_legal_name: string
          user_agent: string | null
        }
        Insert: {
          agreement_version: string
          contract_id: string
          created_at?: string
          electronic_consent_confirmed?: boolean
          id?: string
          ip_address?: string | null
          reservation_id: string
          signed_at?: string
          signed_pdf_hash: string
          time_zone?: string | null
          typed_legal_name: string
          user_agent?: string | null
        }
        Update: {
          agreement_version?: string
          contract_id?: string
          created_at?: string
          electronic_consent_confirmed?: boolean
          id?: string
          ip_address?: string | null
          reservation_id?: string
          signed_at?: string
          signed_pdf_hash?: string
          time_zone?: string | null
          typed_legal_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signature_audit_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          admin_overrides: Json
          agreement_version_id: string
          commitment_months: number
          created_at: string
          customer_legal_name: string
          delivery_fee: number
          email: string
          generated_at: string | null
          id: string
          installation_address: string | null
          insurance_monthly_price: number
          insurance_selected: boolean
          monthly_price: number
          phone: string | null
          placement: string
          preferred_installation_date: string | null
          pricing_snapshot: Json
          rental_summary_snapshot: Json
          replaces_contract_id: string | null
          reservation_id: string
          sauna_type: string
          second_heater_monthly_price: number
          second_heater_selected: boolean
          security_deposit: number
          signed_at: string | null
          signed_pdf_hash: string | null
          signed_pdf_storage_path: string | null
          stair_elevator_charge: number | null
          status: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          admin_overrides?: Json
          agreement_version_id: string
          commitment_months: number
          created_at?: string
          customer_legal_name: string
          delivery_fee: number
          email: string
          generated_at?: string | null
          id?: string
          installation_address?: string | null
          insurance_monthly_price?: number
          insurance_selected?: boolean
          monthly_price: number
          phone?: string | null
          placement: string
          preferred_installation_date?: string | null
          pricing_snapshot?: Json
          rental_summary_snapshot?: Json
          replaces_contract_id?: string | null
          reservation_id: string
          sauna_type: string
          second_heater_monthly_price?: number
          second_heater_selected?: boolean
          security_deposit: number
          signed_at?: string | null
          signed_pdf_hash?: string | null
          signed_pdf_storage_path?: string | null
          stair_elevator_charge?: number | null
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          admin_overrides?: Json
          agreement_version_id?: string
          commitment_months?: number
          created_at?: string
          customer_legal_name?: string
          delivery_fee?: number
          email?: string
          generated_at?: string | null
          id?: string
          installation_address?: string | null
          insurance_monthly_price?: number
          insurance_selected?: boolean
          monthly_price?: number
          phone?: string | null
          placement?: string
          preferred_installation_date?: string | null
          pricing_snapshot?: Json
          rental_summary_snapshot?: Json
          replaces_contract_id?: string | null
          reservation_id?: string
          sauna_type?: string
          second_heater_monthly_price?: number
          second_heater_selected?: boolean
          security_deposit?: number
          signed_at?: string | null
          signed_pdf_hash?: string | null
          signed_pdf_storage_path?: string | null
          stair_elevator_charge?: number | null
          status?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_agreement_version_id_fkey"
            columns: ["agreement_version_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_replaces_contract_id_fkey"
            columns: ["replaces_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
          reservation_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
          reservation_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          access_notes: string | null
          admin_notes: string | null
          city: string | null
          consult_status: string
          contract_status: string
          created_at: string
          email: string
          first_name: string
          hold_created_at: string | null
          hold_deadline: string | null
          id: string
          id_status: string
          install_address: string | null
          last_name: string
          min_commitment_months: number | null
          payment_status: string
          phone: string | null
          placement_choice: string | null
          preferred_install_at: string
          reservation_source: string
          reservation_status: string
          sauna_inventory_id: string | null
          sauna_type_id: string
          secure_token: string
          stripe_payment_id: string | null
          updated_at: string
        }
        Insert: {
          access_notes?: string | null
          admin_notes?: string | null
          city?: string | null
          consult_status?: string
          contract_status?: string
          created_at?: string
          email: string
          first_name: string
          hold_created_at?: string | null
          hold_deadline?: string | null
          id?: string
          id_status?: string
          install_address?: string | null
          last_name: string
          min_commitment_months?: number | null
          payment_status?: string
          phone?: string | null
          placement_choice?: string | null
          preferred_install_at: string
          reservation_source?: string
          reservation_status?: string
          sauna_inventory_id?: string | null
          sauna_type_id: string
          secure_token?: string
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          access_notes?: string | null
          admin_notes?: string | null
          city?: string | null
          consult_status?: string
          contract_status?: string
          created_at?: string
          email?: string
          first_name?: string
          hold_created_at?: string | null
          hold_deadline?: string | null
          id?: string
          id_status?: string
          install_address?: string | null
          last_name?: string
          min_commitment_months?: number | null
          payment_status?: string
          phone?: string | null
          placement_choice?: string | null
          preferred_install_at?: string
          reservation_source?: string
          reservation_status?: string
          sauna_inventory_id?: string | null
          sauna_type_id?: string
          secure_token?: string
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_sauna_inventory_id_fkey"
            columns: ["sauna_inventory_id"]
            isOneToOne: false
            referencedRelation: "sauna_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "public_sauna_availability"
            referencedColumns: ["sauna_type_id"]
          },
          {
            foreignKeyName: "reservations_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "sauna_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sauna_inventory: {
        Row: {
          admin_notes: string | null
          available_date: string | null
          created_at: string
          current_customer: string | null
          id: string
          incoming_eta: string | null
          indoor_outdoor_eligibility: string
          install_date: string | null
          minimum_term_ends: string | null
          model: string | null
          notice_received_date: string | null
          reservation_id: string | null
          sauna_type_id: string
          status: string
          unit_code: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          available_date?: string | null
          created_at?: string
          current_customer?: string | null
          id?: string
          incoming_eta?: string | null
          indoor_outdoor_eligibility?: string
          install_date?: string | null
          minimum_term_ends?: string | null
          model?: string | null
          notice_received_date?: string | null
          reservation_id?: string | null
          sauna_type_id: string
          status?: string
          unit_code?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          available_date?: string | null
          created_at?: string
          current_customer?: string | null
          id?: string
          incoming_eta?: string | null
          indoor_outdoor_eligibility?: string
          install_date?: string | null
          minimum_term_ends?: string | null
          model?: string | null
          notice_received_date?: string | null
          reservation_id?: string | null
          sauna_type_id?: string
          status?: string
          unit_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sauna_inventory_sauna_type_id_fkey"
            columns: ["sauna_type_id"]
            isOneToOne: false
            referencedRelation: "public_sauna_availability"
            referencedColumns: ["sauna_type_id"]
          },
          {
            foreignKeyName: "sauna_inventory_sauna_type_id_fkey"
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
      waitlist_entries: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferred_install_date: string | null
          reservation_source: string
          sauna_type_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          preferred_install_date?: string | null
          reservation_source?: string
          sauna_type_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferred_install_date?: string | null
          reservation_source?: string
          sauna_type_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_sauna_availability: {
        Row: {
          available_now: number | null
          next_available_date: string | null
          sauna_type_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_reservation_with_hold: {
        Args: {
          p_access_notes: string
          p_email: string
          p_first_name: string
          p_install_address: string
          p_last_name: string
          p_min_commitment_months: number
          p_phone: string
          p_placement_choice: string
          p_preferred_install_at: string
          p_sauna_type_id: string
        }
        Returns: string
      }
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
