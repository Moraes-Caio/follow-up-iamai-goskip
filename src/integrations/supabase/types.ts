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
