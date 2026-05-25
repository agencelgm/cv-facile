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
      applications: {
        Row: {
          company_name: string | null
          created_at: string
          credits_used: number
          cv_content: string | null
          cv_generated: boolean
          cv_pdf_url: string | null
          entreprise: string | null
          id: string
          job_offer_text: string | null
          job_title: string | null
          lettre_content: string | null
          lm_generated: boolean
          lm_pdf_url: string | null
          offre: string | null
          poste: string
          status: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          credits_used?: number
          cv_content?: string | null
          cv_generated?: boolean
          cv_pdf_url?: string | null
          entreprise?: string | null
          id?: string
          job_offer_text?: string | null
          job_title?: string | null
          lettre_content?: string | null
          lm_generated?: boolean
          lm_pdf_url?: string | null
          offre?: string | null
          poste: string
          status?: string
          template_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          credits_used?: number
          cv_content?: string | null
          cv_generated?: boolean
          cv_pdf_url?: string | null
          entreprise?: string | null
          id?: string
          job_offer_text?: string | null
          job_title?: string | null
          lettre_content?: string | null
          lm_generated?: boolean
          lm_pdf_url?: string | null
          offre?: string | null
          poste?: string
          status?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          attempts: number
          blocked_until: string | null
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          telephone: string
          user_id: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          telephone: string
          user_id: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          telephone?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_fcfa: number
          chariow_session_id: string | null
          created_at: string
          credits_purchased: number
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_fcfa: number
          chariow_session_id?: string | null
          created_at?: string
          credits_purchased: number
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          chariow_session_id?: string | null
          created_at?: string
          credits_purchased?: number
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          competences: string[]
          created_at: string
          email: string
          experiences: Json
          formations: Json
          id: string
          langues: string[]
          nom: string
          onboarding_completed: boolean
          pays: string | null
          photo_url: string | null
          prenom: string
          resume: string | null
          telephone: string
          titre_professionnel: string | null
          updated_at: string
          user_id: string
          ville: string | null
          whatsapp_verified: boolean
        }
        Insert: {
          competences?: string[]
          created_at?: string
          email: string
          experiences?: Json
          formations?: Json
          id?: string
          langues?: string[]
          nom: string
          onboarding_completed?: boolean
          pays?: string | null
          photo_url?: string | null
          prenom: string
          resume?: string | null
          telephone: string
          titre_professionnel?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
          whatsapp_verified?: boolean
        }
        Update: {
          competences?: string[]
          created_at?: string
          email?: string
          experiences?: Json
          formations?: Json
          id?: string
          langues?: string[]
          nom?: string
          onboarding_completed?: boolean
          pays?: string | null
          photo_url?: string | null
          prenom?: string
          resume?: string | null
          telephone?: string
          titre_professionnel?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
          whatsapp_verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_payment: { Args: { _session_id: string }; Returns: undefined }
      debit_credits: {
        Args: { _amount: number; _description: string; _user_id: string }
        Returns: number
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
