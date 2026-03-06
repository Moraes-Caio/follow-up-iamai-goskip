// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          request_type: string
          response_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          request_type: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          request_type?: string
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          confirmation_sent: boolean | null
          confirmation_sent_at: string | null
          created_at: string
          date: string
          end_time: string | null
          id: string
          lembrete_enviado: boolean | null
          lembrete_enviado_em: string | null
          lembrete_mensagem: string | null
          patient_id: string
          procedure_id: string | null
          procedure_name: string
          professional_id: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          time: string
          was_performed: boolean | null
        }
        Insert: {
          confirmation_sent?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          lembrete_mensagem?: string | null
          patient_id: string
          procedure_id?: string | null
          procedure_name: string
          professional_id?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          time: string
          was_performed?: boolean | null
        }
        Update: {
          confirmation_sent?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          lembrete_mensagem?: string | null
          patient_id?: string
          procedure_id?: string | null
          procedure_name?: string
          professional_id?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          time?: string
          was_performed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_breaks: {
        Row: {
          created_at: string
          day_of_week: number | null
          end_time: string
          id: string
          label: string
          profile_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          end_time: string
          id?: string
          label?: string
          profile_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          end_time?: string
          id?: string
          label?: string
          profile_id?: string
          start_time?: string
        }
        Relationships: []
      }
      clinic_extra_sessions: {
        Row: {
          close_time: string
          created_at: string
          date: string
          id: string
          label: string
          open_time: string
          profile_id: string
        }
        Insert: {
          close_time?: string
          created_at?: string
          date: string
          id?: string
          label?: string
          open_time?: string
          profile_id: string
        }
        Update: {
          close_time?: string
          created_at?: string
          date?: string
          id?: string
          label?: string
          open_time?: string
          profile_id?: string
        }
        Relationships: []
      }
      clinic_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          close_time?: string
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string | null
          alert_unconfirmed: boolean | null
          clinic_name: string
          created_at: string
          email_notifications: boolean | null
          id: string
          phone: string | null
          profile_id: string | null
          specialty: string | null
          updated_at: string
          whatsapp_connected: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          alert_unconfirmed?: boolean | null
          clinic_name?: string
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
          whatsapp_connected?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          alert_unconfirmed?: boolean | null
          clinic_name?: string
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          phone?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
          whatsapp_connected?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          permissions: Json
          profile_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          permissions?: Json
          profile_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          permissions?: Json
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          appointment_id: string | null
          delivered_at: string | null
          id: string
          message_content: string
          patient_id: string
          profile_id: string | null
          read_at: string | null
          recipient_name: string
          recipient_phone: string
          sent_at: string
          status: Database["public"]["Enums"]["message_status"]
          type: Database["public"]["Enums"]["message_type"]
          webhook_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          delivered_at?: string | null
          id?: string
          message_content: string
          patient_id: string
          profile_id?: string | null
          read_at?: string | null
          recipient_name: string
          recipient_phone: string
          sent_at?: string
          status?: Database["public"]["Enums"]["message_status"]
          type: Database["public"]["Enums"]["message_type"]
          webhook_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string
          patient_id?: string
          profile_id?: string | null
          read_at?: string | null
          recipient_name?: string
          recipient_phone?: string
          sent_at?: string
          status?: Database["public"]["Enums"]["message_status"]
          type?: Database["public"]["Enums"]["message_type"]
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          appointment_id: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          priority: Database["public"]["Enums"]["notification_priority"]
          profile_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          appointment_id?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          profile_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          appointment_id?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          profile_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_returns: {
        Row: {
          created_at: string | null
          id: string
          last_procedure_date: string
          lembrete_enviado: boolean | null
          lembrete_enviado_em: string | null
          lembrete_mensagem: string | null
          patient_id: string
          procedure_id: string
          profile_id: string | null
          reminder_send_date: string | null
          return_interval_days: number
          status: Database["public"]["Enums"]["patient_return_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_procedure_date: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          lembrete_mensagem?: string | null
          patient_id: string
          procedure_id: string
          profile_id?: string | null
          reminder_send_date?: string | null
          return_interval_days: number
          status?: Database["public"]["Enums"]["patient_return_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_procedure_date?: string
          lembrete_enviado?: boolean | null
          lembrete_enviado_em?: string | null
          lembrete_mensagem?: string | null
          patient_id?: string
          procedure_id?: string
          profile_id?: string | null
          reminder_send_date?: string | null
          return_interval_days?: number
          status?: Database["public"]["Enums"]["patient_return_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_returns_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_returns_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_returns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string
          created_at: string
          full_name: string
          gender: string | null
          has_responsible: boolean | null
          id: string
          phone: string
          profile_id: string | null
          responsible_birth_date: string | null
          responsible_gender: string | null
          responsible_name: string | null
          responsible_phone: string | null
          responsible_relation:
            | Database["public"]["Enums"]["relation_type"]
            | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          full_name: string
          gender?: string | null
          has_responsible?: boolean | null
          id?: string
          phone: string
          profile_id?: string | null
          responsible_birth_date?: string | null
          responsible_gender?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          responsible_relation?:
            | Database["public"]["Enums"]["relation_type"]
            | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          full_name?: string
          gender?: string | null
          has_responsible?: boolean | null
          id?: string
          phone?: string
          profile_id?: string | null
          responsible_birth_date?: string | null
          responsible_gender?: string | null
          responsible_name?: string | null
          responsible_phone?: string | null
          responsible_relation?:
            | Database["public"]["Enums"]["relation_type"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          cleanup_minutes: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          professional_ids: string[] | null
          profile_id: string | null
          return_interval_days: number | null
          title: string
        }
        Insert: {
          cleanup_minutes?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          professional_ids?: string[] | null
          profile_id?: string | null
          return_interval_days?: number | null
          title: string
        }
        Update: {
          cleanup_minutes?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          professional_ids?: string[] | null
          profile_id?: string | null
          return_interval_days?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          endereco: string | null
          especialidade: string | null
          full_name: string
          id: string
          nome_clinica: string | null
          nome_responsavel: string | null
          onboarding_completed: boolean
          session_token: string | null
          telefone: string | null
          uazapi_server: string | null
          uazapi_token: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          full_name?: string
          id: string
          nome_clinica?: string | null
          nome_responsavel?: string | null
          onboarding_completed?: boolean
          session_token?: string | null
          telefone?: string | null
          uazapi_server?: string | null
          uazapi_token?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          full_name?: string
          id?: string
          nome_clinica?: string | null
          nome_responsavel?: string | null
          onboarding_completed?: boolean
          session_token?: string | null
          telefone?: string | null
          uazapi_server?: string | null
          uazapi_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminder_templates: {
        Row: {
          created_at: string
          days_before_appointment: number | null
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          procedure_id: string | null
          procedure_name: string | null
          profile_id: string | null
          return_interval: number | null
          send_before: number | null
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_before_appointment?: number | null
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          procedure_id?: string | null
          procedure_name?: string | null
          profile_id?: string | null
          return_interval?: number | null
          send_before?: number | null
          type: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_before_appointment?: number | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          procedure_id?: string | null
          procedure_name?: string | null
          profile_id?: string | null
          return_interval?: number | null
          send_before?: number | null
          type?: Database["public"]["Enums"]["reminder_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          is_owner: boolean | null
          password_changed: boolean
          phone: string | null
          profile_id: string | null
          role_id: string
          specialty: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          is_owner?: boolean | null
          password_changed?: boolean
          phone?: string | null
          profile_id?: string | null
          role_id?: string
          specialty?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_owner?: boolean | null
          password_changed?: boolean
          phone?: string | null
          profile_id?: string | null
          role_id?: string
          specialty?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          invited_by_name: string | null
          profile_id: string
          role_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_by_name?: string | null
          profile_id: string
          role_id?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_by_name?: string | null
          profile_id?: string
          role_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { invite_token: string }; Returns: Json }
      cleanup_old_ai_requests: { Args: never; Returns: undefined }
      complete_member_onboarding: {
        Args: {
          member_name: string
          member_phone: string
          new_password: string
        }
        Returns: Json
      }
      get_my_workspace_id: { Args: never; Returns: string }
      get_workspace_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_invitation: { Args: { invite_token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "dentist" | "receptionist"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      gender_type: "male" | "female" | "other"
      interval_unit: "days" | "weeks" | "months" | "years"
      message_status: "sent" | "delivered" | "read" | "failed"
      message_type: "periodic_return" | "appointment_confirmation"
      notification_priority: "low" | "normal" | "high"
      notification_type: "upcoming_appointment" | "completed_appointment"
      patient_return_status: "pendente" | "enviado" | "confirmado" | "ignorado"
      periodic_return_status: "active" | "completed" | "cancelled"
      relation_type:
        | "mother"
        | "father"
        | "guardian"
        | "spouse"
        | "son"
        | "daughter"
        | "other"
      reminder_type: "periodic_return" | "appointment_confirmation"
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
    Enums: {
      app_role: ["admin", "dentist", "receptionist"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      gender_type: ["male", "female", "other"],
      interval_unit: ["days", "weeks", "months", "years"],
      message_status: ["sent", "delivered", "read", "failed"],
      message_type: ["periodic_return", "appointment_confirmation"],
      notification_priority: ["low", "normal", "high"],
      notification_type: ["upcoming_appointment", "completed_appointment"],
      patient_return_status: ["pendente", "enviado", "confirmado", "ignorado"],
      periodic_return_status: ["active", "completed", "cancelled"],
      relation_type: [
        "mother",
        "father",
        "guardian",
        "spouse",
        "son",
        "daughter",
        "other",
      ],
      reminder_type: ["periodic_return", "appointment_confirmation"],
    },
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: ai_requests
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   request_type: text (not null)
//   status: text (not null, default: 'pending'::text)
//   response_message: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: appointments
//   id: uuid (not null, default: gen_random_uuid())
//   patient_id: uuid (not null)
//   date: text (not null)
//   time: text (not null)
//   procedure_name: text (not null)
//   professional_id: uuid (nullable)
//   status: appointment_status (not null, default: 'pending'::appointment_status)
//   confirmation_sent: boolean (nullable, default: false)
//   confirmation_sent_at: timestamp with time zone (nullable)
//   was_performed: boolean (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
//   lembrete_enviado: boolean (nullable, default: false)
//   lembrete_mensagem: text (nullable)
//   lembrete_enviado_em: timestamp with time zone (nullable)
//   end_time: text (nullable)
//   procedure_id: uuid (nullable)
// Table: clinic_breaks
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   day_of_week: integer (nullable)
//   start_time: text (not null)
//   end_time: text (not null)
//   label: text (not null, default: 'Pausa'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: clinic_extra_sessions
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   date: date (not null)
//   open_time: text (not null, default: '08:00'::text)
//   close_time: text (not null, default: '18:00'::text)
//   label: text (not null, default: 'Sessão Extra'::text)
//   created_at: timestamp with time zone (not null, default: now())
// Table: clinic_hours
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   day_of_week: integer (not null)
//   is_open: boolean (not null, default: true)
//   open_time: text (not null, default: '08:00'::text)
//   close_time: text (not null, default: '18:00'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: clinic_settings
//   id: uuid (not null, default: gen_random_uuid())
//   clinic_name: text (not null, default: 'Minha Clínica'::text)
//   specialty: text (nullable, default: ''::text)
//   phone: text (nullable, default: ''::text)
//   address: text (nullable, default: ''::text)
//   whatsapp_connected: boolean (nullable, default: false)
//   whatsapp_number: text (nullable)
//   email_notifications: boolean (nullable, default: true)
//   alert_unconfirmed: boolean (nullable, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
// Table: custom_roles
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
//   icon: text (nullable, default: '👨‍💼'::text)
//   permissions: jsonb (not null, default: '{}'::jsonb)
//   is_default: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
//   color: text (nullable, default: '#3b82f6'::text)
// Table: messages
//   id: uuid (not null, default: gen_random_uuid())
//   patient_id: uuid (not null)
//   appointment_id: uuid (nullable)
//   type: message_type (not null)
//   recipient_phone: text (not null)
//   recipient_name: text (not null)
//   message_content: text (not null)
//   status: message_status (not null, default: 'sent'::message_status)
//   sent_at: timestamp with time zone (not null, default: now())
//   delivered_at: timestamp with time zone (nullable)
//   read_at: timestamp with time zone (nullable)
//   profile_id: uuid (nullable)
//   webhook_id: text (nullable)
// Table: notifications
//   id: uuid (not null, default: gen_random_uuid())
//   type: notification_type (not null)
//   appointment_id: uuid (nullable)
//   title: text (not null)
//   description: text (not null)
//   is_read: boolean (nullable, default: false)
//   is_archived: boolean (nullable, default: false)
//   priority: notification_priority (not null, default: 'normal'::notification_priority)
//   category: text (nullable, default: ''::text)
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
// Table: patient_returns
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (nullable)
//   patient_id: uuid (not null)
//   procedure_id: uuid (not null)
//   last_procedure_date: date (not null)
//   return_interval_days: integer (not null)
//   reminder_send_date: date (nullable)
//   lembrete_enviado: boolean (nullable, default: false)
//   lembrete_enviado_em: timestamp with time zone (nullable)
//   lembrete_mensagem: text (nullable)
//   status: patient_return_status (nullable, default: 'pendente'::patient_return_status)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: patients
//   id: uuid (not null, default: gen_random_uuid())
//   full_name: text (not null)
//   birth_date: date (not null)
//   phone: text (not null)
//   gender: text (nullable)
//   has_responsible: boolean (nullable, default: false)
//   responsible_name: text (nullable)
//   responsible_relation: relation_type (nullable)
//   responsible_phone: text (nullable)
//   responsible_gender: text (nullable)
//   responsible_birth_date: date (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
// Table: procedures
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (not null)
//   description: text (nullable)
//   professional_ids: _uuid (nullable, default: '{}'::uuid[])
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
//   return_interval_days: integer (nullable)
//   duration_minutes: integer (nullable)
//   cleanup_minutes: integer (nullable, default: 15)
// Table: profiles
//   id: uuid (not null)
//   full_name: text (not null, default: ''::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   email: text (nullable)
//   nome_clinica: text (nullable, default: 'Minha Clínica'::text)
//   telefone: text (nullable, default: ''::text)
//   ativo: boolean (not null, default: true)
//   uazapi_server: text (nullable)
//   uazapi_token: text (nullable)
//   endereco: text (nullable, default: ''::text)
//   especialidade: text (nullable, default: ''::text)
//   nome_responsavel: text (nullable)
//   onboarding_completed: boolean (not null, default: false)
//   session_token: text (nullable)
// Table: reminder_templates
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   type: reminder_type (not null)
//   procedure_name: text (nullable)
//   return_interval: integer (nullable)
//   send_before: integer (nullable)
//   days_before_appointment: integer (nullable)
//   message_template: text (not null)
//   is_active: boolean (nullable, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
//   procedure_id: uuid (nullable)
//   updated_at: timestamp with time zone (not null, default: now())
// Table: team_members
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   full_name: text (not null)
//   email: text (not null)
//   role_id: text (not null, default: 'receptionist'::text)
//   specialty: text (nullable)
//   is_active: boolean (nullable, default: true)
//   is_owner: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   profile_id: uuid (nullable)
//   phone: text (nullable)
//   password_changed: boolean (not null, default: true)
// Table: user_roles
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   role: app_role (not null, default: 'receptionist'::app_role)
// Table: workspace_invitations
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   email: text (not null)
//   token: uuid (not null, default: gen_random_uuid())
//   role_id: text (not null, default: 'receptionist'::text)
//   status: text (not null, default: 'pending'::text)
//   invited_by: uuid (not null)
//   invited_by_name: text (nullable)
//   expires_at: timestamp with time zone (not null, default: (now() + '7 days'::interval))
//   created_at: timestamp with time zone (not null, default: now())
//   accepted_at: timestamp with time zone (nullable)
//   accepted_by: uuid (nullable)

// --- CONSTRAINTS ---
// Table: ai_requests
//   PRIMARY KEY ai_requests_pkey: PRIMARY KEY (id)
//   CHECK ai_requests_request_type_check: CHECK ((request_type = ANY (ARRAY['gerar'::text, 'melhorar'::text])))
//   CHECK ai_requests_status_check: CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text])))
// Table: appointments
//   FOREIGN KEY appointments_patient_id_fkey: FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
//   PRIMARY KEY appointments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY appointments_professional_id_fkey: FOREIGN KEY (professional_id) REFERENCES team_members(id) ON DELETE SET NULL
//   FOREIGN KEY appointments_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: clinic_breaks
//   CHECK clinic_breaks_day_of_week_check: CHECK (((day_of_week IS NULL) OR ((day_of_week >= 0) AND (day_of_week <= 6))))
//   PRIMARY KEY clinic_breaks_pkey: PRIMARY KEY (id)
// Table: clinic_extra_sessions
//   PRIMARY KEY clinic_extra_sessions_pkey: PRIMARY KEY (id)
// Table: clinic_hours
//   CHECK clinic_hours_day_of_week_check: CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
//   PRIMARY KEY clinic_hours_pkey: PRIMARY KEY (id)
//   UNIQUE clinic_hours_profile_id_day_of_week_key: UNIQUE (profile_id, day_of_week)
// Table: clinic_settings
//   PRIMARY KEY clinic_settings_pkey: PRIMARY KEY (id)
//   FOREIGN KEY clinic_settings_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: custom_roles
//   PRIMARY KEY custom_roles_pkey: PRIMARY KEY (id)
//   FOREIGN KEY custom_roles_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: messages
//   FOREIGN KEY messages_appointment_id_fkey: FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
//   FOREIGN KEY messages_patient_id_fkey: FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
//   PRIMARY KEY messages_pkey: PRIMARY KEY (id)
//   FOREIGN KEY messages_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: notifications
//   FOREIGN KEY notifications_appointment_id_fkey: FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
//   PRIMARY KEY notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notifications_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: patient_returns
//   FOREIGN KEY patient_returns_patient_id_fkey: FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
//   PRIMARY KEY patient_returns_pkey: PRIMARY KEY (id)
//   FOREIGN KEY patient_returns_procedure_id_fkey: FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE
//   FOREIGN KEY patient_returns_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: patients
//   PRIMARY KEY patients_pkey: PRIMARY KEY (id)
//   FOREIGN KEY patients_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: procedures
//   PRIMARY KEY procedures_pkey: PRIMARY KEY (id)
//   FOREIGN KEY procedures_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: reminder_templates
//   PRIMARY KEY reminder_templates_pkey: PRIMARY KEY (id)
//   FOREIGN KEY reminder_templates_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: team_members
//   UNIQUE team_members_email_key: UNIQUE (email)
//   PRIMARY KEY team_members_pkey: PRIMARY KEY (id)
//   FOREIGN KEY team_members_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
//   FOREIGN KEY team_members_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: user_roles
//   PRIMARY KEY user_roles_pkey: PRIMARY KEY (id)
//   FOREIGN KEY user_roles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE user_roles_user_id_role_key: UNIQUE (user_id, role)
// Table: workspace_invitations
//   PRIMARY KEY workspace_invitations_pkey: PRIMARY KEY (id)
//   UNIQUE workspace_invitations_token_key: UNIQUE (token)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: ai_requests
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: appointments
//   Policy "Workspace members can delete appointments" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can insert appointments" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can update appointments" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view appointments" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: clinic_breaks
//   Policy "Workspace members can manage clinic_breaks" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view clinic_breaks" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: clinic_extra_sessions
//   Policy "Workspace members can manage clinic_extra_sessions" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view clinic_extra_sessions" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: clinic_hours
//   Policy "Workspace members can manage clinic_hours" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view clinic_hours" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: clinic_settings
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: custom_roles
//   Policy "Workspace members can manage custom_roles" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view custom_roles" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: messages
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: notifications
//   Policy "Workspace members can insert notifications" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can update notifications" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view notifications" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: patient_returns
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: patients
//   Policy "Workspace members can delete patients" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can insert patients" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can update patients" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view patients" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: procedures
//   Policy "Workspace members can manage procedures" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view procedures" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: profiles
//   Policy "Users can insert own profile" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (auth.uid() = id)
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//   Policy "Users can view own or workspace profile" (SELECT, PERMISSIVE) roles={public}
//     USING: ((id = auth.uid()) OR (id = get_workspace_id()))
// Table: reminder_templates
//   Policy "Workspace members can manage reminder_templates" (ALL, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace members can view reminder_templates" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())
// Table: team_members
//   Policy "Workspace members can view team" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "Workspace owner can delete team" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = auth.uid())
//   Policy "Workspace owner can insert team" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = auth.uid())
//   Policy "Workspace owner can update team" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_my_workspace_id())
//   Policy "users_can_link_own_membership" (UPDATE, PERMISSIVE) roles={public}
//     USING: ((lower(email) = lower(auth.email())) AND (user_id IS NULL))
//     WITH CHECK: (lower(email) = lower(auth.email()))
//   Policy "users_view_by_email" (SELECT, PERMISSIVE) roles={public}
//     USING: (lower(email) = lower(auth.email()))
//   Policy "users_view_own_membership" (SELECT, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
// Table: user_roles
//   Policy "Admins can manage roles" (ALL, PERMISSIVE) roles={public}
//     USING: has_role(auth.uid(), 'admin'::app_role)
//   Policy "Users can view own roles" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: workspace_invitations
//   Policy "workspace_delete" (DELETE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_insert" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (profile_id = get_workspace_id())
//   Policy "workspace_select" (SELECT, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//   Policy "workspace_update" (UPDATE, PERMISSIVE) roles={public}
//     USING: (profile_id = get_workspace_id())
//     WITH CHECK: (profile_id = get_workspace_id())

// --- DATABASE FUNCTIONS ---
// FUNCTION accept_invitation(uuid)
//   CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token uuid)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     inv RECORD;
//     current_user_id UUID;
//     current_user_email TEXT;
//     current_user_name TEXT;
//     member_exists BOOLEAN;
//   BEGIN
//     current_user_id := auth.uid();
//   
//     IF current_user_id IS NULL THEN
//       RETURN json_build_object('success', FALSE, 'error', 'Usuário não autenticado.');
//     END IF;
//   
//     -- Buscar dados do usuário logado
//     SELECT email, raw_user_meta_data->>'full_name'
//     INTO current_user_email, current_user_name
//     FROM auth.users WHERE id = current_user_id;
//   
//     -- Buscar convite válido
//     SELECT * INTO inv
//     FROM public.workspace_invitations
//     WHERE token = invite_token AND status = 'pending' AND expires_at > NOW();
//   
//     IF NOT FOUND THEN
//       RETURN json_build_object('success', FALSE, 'error', 'Convite inválido ou expirado.');
//     END IF;
//   
//     -- Verificar se e-mail bate
//     IF current_user_email != inv.email THEN
//       RETURN json_build_object('success', FALSE, 'error', 'Este convite foi enviado para outro e-mail.');
//     END IF;
//   
//     -- Verificar se já é membro deste workspace
//     SELECT EXISTS(
//       SELECT 1 FROM public.team_members
//       WHERE user_id = current_user_id AND profile_id = inv.profile_id
//     ) INTO member_exists;
//   
//     IF member_exists THEN
//       -- Reativar e atualizar role
//       UPDATE public.team_members
//       SET is_active = TRUE,
//           role_id = inv.role_id,
//           email = current_user_email,
//           full_name = COALESCE(current_user_name, full_name)
//       WHERE user_id = current_user_id AND profile_id = inv.profile_id;
//     ELSE
//       -- Criar novo membro
//       INSERT INTO public.team_members (
//         profile_id, user_id, full_name, email, role_id, is_active, is_owner
//       ) VALUES (
//         inv.profile_id,
//         current_user_id,
//         COALESCE(current_user_name, ''),
//         current_user_email,
//         inv.role_id,
//         TRUE,
//         FALSE
//       );
//     END IF;
//   
//     -- Marcar convite como aceito
//     UPDATE public.workspace_invitations
//     SET status = 'accepted',
//         accepted_at = NOW(),
//         accepted_by = current_user_id
//     WHERE token = invite_token;
//   
//     RETURN json_build_object('success', TRUE, 'profile_id', inv.profile_id);
//   END;
//   $function$
//   
// FUNCTION cleanup_old_ai_requests()
//   CREATE OR REPLACE FUNCTION public.cleanup_old_ai_requests()
//    RETURNS void
//    LANGUAGE sql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//     DELETE FROM public.ai_requests WHERE created_at < now() - interval '1 hour';
//   $function$
//   
// FUNCTION complete_member_onboarding(text, text, text)
//   CREATE OR REPLACE FUNCTION public.complete_member_onboarding(new_password text, member_name text, member_phone text)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     current_user_id UUID;
//   BEGIN
//     current_user_id := auth.uid();
//   
//     IF current_user_id IS NULL THEN
//       RETURN json_build_object('success', FALSE, 'error', 'Usuário não autenticado.');
//     END IF;
//   
//     IF LENGTH(new_password) < 6 THEN
//       RETURN json_build_object('success', FALSE, 'error', 'A senha deve ter no mínimo 6 caracteres.');
//     END IF;
//   
//     UPDATE auth.users
//     SET encrypted_password = crypt(new_password, gen_salt('bf'))
//     WHERE id = current_user_id;
//   
//     UPDATE public.team_members
//     SET full_name = member_name,
//         phone = member_phone,
//         password_changed = TRUE,
//         user_id = current_user_id
//     WHERE user_id = current_user_id
//        OR (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = current_user_id));
//   
//     RETURN json_build_object('success', TRUE);
//   END;
//   $function$
//   
// FUNCTION fn_patient_returns_set_reminder_fields()
//   CREATE OR REPLACE FUNCTION public.fn_patient_returns_set_reminder_fields()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_return_interval int;
//     v_send_before int;
//     v_effective_days int;
//   BEGIN
//     IF NEW.procedure_id IS NULL OR NEW.last_procedure_date IS NULL THEN
//       RETURN NEW;
//     END IF;
//   
//     SELECT rt.return_interval, rt.send_before
//       INTO v_return_interval, v_send_before
//     FROM public.reminder_templates rt
//     WHERE rt.procedure_id = NEW.procedure_id
//     LIMIT 1;
//   
//     IF NOT FOUND THEN
//       RETURN NEW;
//     END IF;
//   
//     v_return_interval := COALESCE(v_return_interval, 0);
//     v_send_before := COALESCE(v_send_before, 0);
//     v_effective_days := v_return_interval - v_send_before;
//   
//     NEW.return_interval_days := v_effective_days;
//     -- reminder_send_date is a generated column, no need to set it
//   
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_recalc_patient_returns_on_template_change()
//   CREATE OR REPLACE FUNCTION public.fn_recalc_patient_returns_on_template_change()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     UPDATE public.patient_returns
//     SET 
//       return_interval_days = COALESCE(NEW.return_interval, 0) - COALESCE(NEW.send_before, 0),
//       updated_at = now()
//     WHERE procedure_id = NEW.procedure_id
//       AND NEW.procedure_id IS NOT NULL;
//     
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_sync_procedure_to_patient_returns()
//   CREATE OR REPLACE FUNCTION public.fn_sync_procedure_to_patient_returns()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF OLD.return_interval_days IS DISTINCT FROM NEW.return_interval_days THEN
//       UPDATE public.patient_returns
//       SET return_interval_days = NEW.return_interval_days,
//           updated_at = now()
//       WHERE procedure_id = NEW.id;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_sync_procedure_to_reminder_templates()
//   CREATE OR REPLACE FUNCTION public.fn_sync_procedure_to_reminder_templates()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- When a procedure's return_interval_days changes, update all linked reminder_templates
//     UPDATE public.reminder_templates
//     SET return_interval = NEW.return_interval_days,
//         updated_at = now()
//     WHERE procedure_id = NEW.id
//       AND type = 'periodic_return';
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION get_my_workspace_id()
//   CREATE OR REPLACE FUNCTION public.get_my_workspace_id()
//    RETURNS uuid
//    LANGUAGE plpgsql
//    STABLE SECURITY DEFINER
//   AS $function$
//   DECLARE
//     workspace uuid;
//   BEGIN
//     -- Primeiro, verifica se o usuário é um owner (profile_id = auth.uid())
//     -- Nesse caso, o workspace é o próprio ID dele
//     SELECT tm.profile_id INTO workspace
//     FROM public.team_members tm
//     WHERE tm.user_id = auth.uid()
//       AND tm.is_active = true
//     LIMIT 1;
//     
//     IF workspace IS NOT NULL THEN
//       RETURN workspace;
//     END IF;
//     
//     -- Se não encontrou por user_id, tenta por email
//     SELECT tm.profile_id INTO workspace
//     FROM public.team_members tm
//     WHERE tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
//       AND tm.is_active = true
//     LIMIT 1;
//     
//     IF workspace IS NOT NULL THEN
//       RETURN workspace;
//     END IF;
//     
//     -- Fallback: retorna o próprio user id (owner sem team_member ainda)
//     RETURN auth.uid();
//   END;
//   $function$
//   
// FUNCTION get_workspace_id()
//   CREATE OR REPLACE FUNCTION public.get_workspace_id()
//    RETURNS uuid
//    LANGUAGE sql
//    STABLE SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//     SELECT COALESCE(
//       (SELECT profile_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
//       auth.uid()
//     );
//   $function$
//   
// FUNCTION handle_new_team_owner()
//   CREATE OR REPLACE FUNCTION public.handle_new_team_owner()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- Skip if this email is already an invited member
//     IF EXISTS (
//       SELECT 1 FROM public.team_members 
//       WHERE lower(email) = lower(COALESCE(NEW.email, ''))
//     ) THEN
//       -- Link the user_id to the existing invited member record
//       UPDATE public.team_members
//       SET user_id = NEW.id
//       WHERE lower(email) = lower(COALESCE(NEW.email, ''))
//         AND user_id IS NULL;
//       RETURN NEW;
//     END IF;
//   
//     INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active, user_id)
//     VALUES (NEW.id, NEW.full_name, COALESCE(NEW.email, ''), 'admin', true, true, NEW.id)
//     ON CONFLICT DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, full_name, email, nome_responsavel, nome_clinica)
//     VALUES (
//       NEW.id,
//       COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
//       COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica')
//     );
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user_default_clinic_hours()
//   CREATE OR REPLACE FUNCTION public.handle_new_user_default_clinic_hours()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     INSERT INTO public.clinic_hours (profile_id, day_of_week, is_open, open_time, close_time)
//     VALUES
//       (NEW.id, 0, false, '08:00', '18:00'),
//       (NEW.id, 1, true, '08:00', '18:00'),
//       (NEW.id, 2, true, '08:00', '18:00'),
//       (NEW.id, 3, true, '08:00', '18:00'),
//       (NEW.id, 4, true, '08:00', '18:00'),
//       (NEW.id, 5, true, '08:00', '18:00'),
//       (NEW.id, 6, false, '08:00', '18:00');
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user_default_templates()
//   CREATE OR REPLACE FUNCTION public.handle_new_user_default_templates()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     INSERT INTO public.reminder_templates (
//       profile_id, name, type, message_template, is_active, days_before_appointment
//     ) VALUES (
//       NEW.id,
//       'Confirmação de Consulta',
//       'appointment_confirmation',
//       'Olá {nome_responsavel}! 😊
//   
//   Passando para lembrar que {nome_paciente} tem uma consulta agendada para o dia {data} às {horario}.
//   
//   📍 {clinica}
//   🦷 Procedimento: {procedimento}
//   
//   Por favor, confirme sua presença respondendo esta mensagem.
//   
//   Caso precise reagendar, entre em contato conosco. Estamos à disposição! 💙',
//       true,
//       1
//     );
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION has_role(uuid, app_role)
//   CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
//    RETURNS boolean
//    LANGUAGE sql
//    STABLE SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//     SELECT EXISTS (
//       SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
//     )
//   $function$
//   
// FUNCTION update_updated_at()
//   CREATE OR REPLACE FUNCTION public.update_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     NEW.updated_at = now();
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION validate_invitation(uuid)
//   CREATE OR REPLACE FUNCTION public.validate_invitation(invite_token uuid)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     inv RECORD;
//   BEGIN
//     SELECT
//       wi.*,
//       cr.name as role_name
//     INTO inv
//     FROM public.workspace_invitations wi
//     LEFT JOIN public.custom_roles cr ON cr.id::text = wi.role_id
//     WHERE wi.token = invite_token;
//   
//     IF NOT FOUND THEN
//       RETURN json_build_object('valid', FALSE, 'error', 'Convite não encontrado.');
//     END IF;
//   
//     IF inv.status != 'pending' THEN
//       RETURN json_build_object('valid', FALSE, 'error', 'Este convite já foi utilizado.');
//     END IF;
//   
//     IF inv.expires_at < NOW() THEN
//       UPDATE public.workspace_invitations SET status = 'expired' WHERE token = invite_token;
//       RETURN json_build_object('valid', FALSE, 'error', 'Este convite expirou. Solicite um novo ao administrador.');
//     END IF;
//   
//     RETURN json_build_object(
//       'valid', TRUE,
//       'email', inv.email,
//       'invited_by_name', inv.invited_by_name,
//       'role_name', COALESCE(inv.role_name, inv.role_id),
//       'profile_id', inv.profile_id,
//       'role_id', inv.role_id
//     );
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: clinic_hours
//   update_clinic_hours_updated_at: CREATE TRIGGER update_clinic_hours_updated_at BEFORE UPDATE ON public.clinic_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at()
// Table: clinic_settings
//   update_clinic_settings_updated_at: CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at()
// Table: patient_returns
//   set_patient_returns_updated_at: CREATE TRIGGER set_patient_returns_updated_at BEFORE UPDATE ON public.patient_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at()
//   trg_patient_returns_set_reminder_fields: CREATE TRIGGER trg_patient_returns_set_reminder_fields BEFORE INSERT OR UPDATE ON public.patient_returns FOR EACH ROW EXECUTE FUNCTION fn_patient_returns_set_reminder_fields()
// Table: patients
//   update_patients_updated_at: CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at()
// Table: procedures
//   trg_sync_procedure_return_interval: CREATE TRIGGER trg_sync_procedure_return_interval AFTER UPDATE OF return_interval_days ON public.procedures FOR EACH ROW WHEN ((old.return_interval_days IS DISTINCT FROM new.return_interval_days)) EXECUTE FUNCTION fn_sync_procedure_to_reminder_templates()
//   trg_sync_procedure_to_patient_returns: CREATE TRIGGER trg_sync_procedure_to_patient_returns AFTER UPDATE OF return_interval_days ON public.procedures FOR EACH ROW EXECUTE FUNCTION fn_sync_procedure_to_patient_returns()
// Table: profiles
//   on_profile_created_add_owner: CREATE TRIGGER on_profile_created_add_owner AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_team_owner()
//   on_profile_created_default_clinic_hours: CREATE TRIGGER on_profile_created_default_clinic_hours AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user_default_clinic_hours()
//   on_profile_created_team_owner: CREATE TRIGGER on_profile_created_team_owner AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_team_owner()
//   trg_new_user_default_templates: CREATE TRIGGER trg_new_user_default_templates AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user_default_templates()
//   update_profiles_updated_at: CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at()
// Table: reminder_templates
//   trg_recalc_returns_on_template_change: CREATE TRIGGER trg_recalc_returns_on_template_change AFTER UPDATE ON public.reminder_templates FOR EACH ROW WHEN (((old.return_interval IS DISTINCT FROM new.return_interval) OR (old.send_before IS DISTINCT FROM new.send_before) OR (old.procedure_id IS DISTINCT FROM new.procedure_id))) EXECUTE FUNCTION fn_recalc_patient_returns_on_template_change()
//   update_reminder_templates_updated_at: CREATE TRIGGER update_reminder_templates_updated_at BEFORE UPDATE ON public.reminder_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at()

// --- INDEXES ---
// Table: appointments
//   CREATE INDEX idx_appointments_data ON public.appointments USING btree (date)
//   CREATE INDEX idx_appointments_lembrete ON public.appointments USING btree (lembrete_enviado, date) WHERE ((lembrete_enviado = false) AND (status = 'pending'::appointment_status))
//   CREATE INDEX idx_appointments_profile ON public.appointments USING btree (profile_id)
// Table: clinic_hours
//   CREATE UNIQUE INDEX clinic_hours_profile_id_day_of_week_key ON public.clinic_hours USING btree (profile_id, day_of_week)
// Table: patient_returns
//   CREATE INDEX idx_patient_returns_pending ON public.patient_returns USING btree (lembrete_enviado, reminder_send_date) WHERE ((lembrete_enviado = false) AND (status = 'pendente'::patient_return_status))
//   CREATE INDEX idx_patient_returns_profile ON public.patient_returns USING btree (profile_id)
//   CREATE INDEX idx_patient_returns_send_date ON public.patient_returns USING btree (reminder_send_date)
// Table: patients
//   CREATE INDEX idx_patients_profile ON public.patients USING btree (profile_id)
// Table: team_members
//   CREATE INDEX idx_team_members_user_id_active ON public.team_members USING btree (user_id) WHERE (is_active = true)
//   CREATE UNIQUE INDEX team_members_email_key ON public.team_members USING btree (email)
// Table: user_roles
//   CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role)
// Table: workspace_invitations
//   CREATE UNIQUE INDEX workspace_invitations_token_key ON public.workspace_invitations USING btree (token)

