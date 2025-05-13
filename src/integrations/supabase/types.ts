export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_summaries: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          summary_json: Json
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          summary_json: Json
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          summary_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "batch_summaries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "prompt_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_questionnaires: {
        Row: {
          aliases: string[] | null
          brand_name: string
          competitors: string[]
          created_at: string
          error_message: string | null
          id: string
          sector: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          aliases?: string[] | null
          brand_name: string
          competitors: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          sector?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          aliases?: string[] | null
          brand_name?: string
          competitors?: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          sector?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      final_reports: {
        Row: {
          cost_alert: boolean | null
          cost_eur: number | null
          created_at: string
          id: string
          pdf_url: string | null
          questionnaire_id: string
          status: string
          summary_json: Json | null
          total_tokens: number | null
          updated_at: string
        }
        Insert: {
          cost_alert?: boolean | null
          cost_eur?: number | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          questionnaire_id: string
          status?: string
          summary_json?: Json | null
          total_tokens?: number | null
          updated_at?: string
        }
        Update: {
          cost_alert?: boolean | null
          cost_eur?: number | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          questionnaire_id?: string
          status?: string
          summary_json?: Json | null
          total_tokens?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_reports_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: true
            referencedRelation: "brand_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_batches: {
        Row: {
          batch_number: number
          created_at: string
          error_message: string | null
          id: string
          questionnaire_id: string
          questions: Json
          status: string
          updated_at: string
        }
        Insert: {
          batch_number: number
          created_at?: string
          error_message?: string | null
          id?: string
          questionnaire_id: string
          questions: Json
          status?: string
          updated_at?: string
        }
        Update: {
          batch_number?: number
          created_at?: string
          error_message?: string | null
          id?: string
          questionnaire_id?: string
          questions?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_batches_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "brand_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_responses: {
        Row: {
          answer_text: string
          batch_id: string
          brand_match: boolean | null
          competitor_matches: string[] | null
          created_at: string
          id: string
          question_text: string
          tokens_used: number | null
        }
        Insert: {
          answer_text: string
          batch_id: string
          brand_match?: boolean | null
          competitor_matches?: string[] | null
          created_at?: string
          id?: string
          question_text: string
          tokens_used?: number | null
        }
        Update: {
          answer_text?: string
          batch_id?: string
          brand_match?: boolean | null
          competitor_matches?: string[] | null
          created_at?: string
          id?: string
          question_text?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_responses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "prompt_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          company_name: string | null
          competitors: string[] | null
          created_at: string
          id: string
          order_id: string
          sector: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name?: string | null
          competitors?: string[] | null
          created_at?: string
          id?: string
          order_id: string
          sector?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string | null
          competitors?: string[] | null
          created_at?: string
          id?: string
          order_id?: string
          sector?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_queue_health: {
        Row: {
          avg_age_minutes: number | null
          batch_count: number | null
          status: string | null
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
