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
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          ip_address: string | null
          user_id: string | null
          user_nome: string | null
          user_role: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_nome?: string | null
          user_role?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          user_nome?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          client_id: string | null
          created_at: string
          data: string
          data_fim: string | null
          dependent_id: string | null
          descricao: string | null
          faixas_horario: Json | null
          gcoin_consumido: boolean | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          professional_id: string | null
          status: string | null
          tipo: string
          titulo: string | null
          updated_at: string
          user_id: string
          external_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data: string
          data_fim?: string | null
          dependent_id?: string | null
          descricao?: string | null
          faixas_horario?: Json | null
          gcoin_consumido?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          professional_id?: string | null
          status?: string | null
          tipo: string
          titulo?: string | null
          updated_at?: string
          user_id: string
          external_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data?: string
          data_fim?: string | null
          dependent_id?: string | null
          descricao?: string | null
          faixas_horario?: Json | null
          gcoin_consumido?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          professional_id?: string | null
          status?: string | null
          tipo?: string
          titulo?: string | null
          updated_at?: string
          user_id?: string
          external_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sync_settings: {
        Row: {
          id: string
          user_id: string
          access_token: string | null
          refresh_token: string | null
          calendar_id: string | null
          sync_enabled: boolean | null
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_id?: string | null
          sync_enabled?: boolean | null
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string | null
          refresh_token?: string | null
          calendar_id?: string | null
          sync_enabled?: boolean | null
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_sync_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          professional_id: string
          sender_id: string
        }
        Insert: {
          attachment?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          professional_id: string
          sender_id: string
        }
        Update: {
          attachment?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          professional_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_cards: {
        Row: {
          ativo: boolean | null
          autor_id: string | null
          conteudo_completo: string
          created_at: string
          id: string
          imagem_capa: string | null
          imagens_adicionais: string[] | null
          ordem: number | null
          preview: string | null
          publicado_em: string | null
          subtitulo: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          ativo?: boolean | null
          autor_id?: string | null
          conteudo_completo: string
          created_at?: string
          id?: string
          imagem_capa?: string | null
          imagens_adicionais?: string[] | null
          ordem?: number | null
          preview?: string | null
          publicado_em?: string | null
          subtitulo?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          ativo?: boolean | null
          autor_id?: string | null
          conteudo_completo?: string
          created_at?: string
          id?: string
          imagem_capa?: string | null
          imagens_adicionais?: string[] | null
          ordem?: number | null
          preview?: string | null
          publicado_em?: string | null
          subtitulo?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_cards_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dependent_links: {
        Row: {
          created_at: string
          dependent_id: string
          id: string
          permissions: Json | null
          responsible_id: string
        }
        Insert: {
          created_at?: string
          dependent_id: string
          id?: string
          permissions?: Json | null
          responsible_id: string
        }
        Update: {
          created_at?: string
          dependent_id?: string
          id?: string
          permissions?: Json | null
          responsible_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependent_links_dependent_id_fkey"
            columns: ["dependent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependent_links_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gcoins: {
        Row: {
          client_id: string
          consumido: number
          created_at: string
          data_liberacao: string
          disponivel: number | null
          id: string
          professional_id: string
          proposta_id: string | null
          quantidade: number
        }
        Insert: {
          client_id: string
          consumido?: number
          created_at?: string
          data_liberacao?: string
          disponivel?: number | null
          id?: string
          professional_id: string
          proposta_id?: string | null
          quantidade?: number
        }
        Update: {
          client_id?: string
          consumido?: number
          created_at?: string
          data_liberacao?: string
          disponivel?: number | null
          id?: string
          professional_id?: string
          proposta_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "gcoins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gcoins_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          descricao: string | null
          entidade_id: string | null
          id: string
          lida: boolean | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          lida?: boolean | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          entidade_id?: string | null
          id?: string
          lida?: boolean | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_client_links: {
        Row: {
          client_id: string
          created_at: string
          data_vinculo: string
          gcoins_liberados: boolean | null
          id: string
          professional_id: string
          proposta_aceita: boolean | null
        }
        Insert: {
          client_id: string
          created_at?: string
          data_vinculo?: string
          gcoins_liberados?: boolean | null
          id?: string
          professional_id: string
          proposta_aceita?: boolean | null
        }
        Update: {
          client_id?: string
          created_at?: string
          data_vinculo?: string
          gcoins_liberados?: boolean | null
          id?: string
          professional_id?: string
          proposta_aceita?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_client_links_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_ratings: {
        Row: {
          anonimo: boolean | null
          client_id: string
          comentario: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          anonimo?: boolean | null
          client_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          anonimo?: boolean | null
          client_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_ratings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_records: {
        Row: {
          anexo: string | null
          client_id: string
          conteudo: string | null
          created_at: string
          criado_por: string
          dados: Json | null
          id: string
          professional_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anexo?: string | null
          client_id: string
          conteudo?: string | null
          created_at?: string
          criado_por: string
          dados?: Json | null
          id?: string
          professional_id: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anexo?: string | null
          client_id?: string
          conteudo?: string | null
          created_at?: string
          criado_por?: string
          dados?: Json | null
          id?: string
          professional_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          ativa: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          registro_tipo: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          registro_tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          registro_tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acesso_fox_imobiliario: boolean | null
          acesso_health_app: boolean | null
          antecedencia_agendamento: number | null
          antecedencia_cancelamento: number | null
          avatar_url: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          descricao: string | null
          email: string | null
          especialidades: string[] | null
          estado: string | null
          id: string
          nome: string
          notificacoes: Json | null
          pais: string | null
          perfil_ativo: boolean | null
          profession_id: string | null
          profissao: string | null
          rating_average: number | null
          rating_count: number | null
          registro: string | null
          specialization_ids: string[] | null
          target_audience_ids: string[] | null
          telefone: string | null
          tipo_atendimento: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acesso_fox_imobiliario?: boolean | null
          acesso_health_app?: boolean | null
          antecedencia_agendamento?: number | null
          antecedencia_cancelamento?: number | null
          avatar_url?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          especialidades?: string[] | null
          estado?: string | null
          id?: string
          nome: string
          notificacoes?: Json | null
          pais?: string | null
          perfil_ativo?: boolean | null
          profession_id?: string | null
          profissao?: string | null
          rating_average?: number | null
          rating_count?: number | null
          registro?: string | null
          specialization_ids?: string[] | null
          target_audience_ids?: string[] | null
          telefone?: string | null
          tipo_atendimento?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acesso_fox_imobiliario?: boolean | null
          acesso_health_app?: boolean | null
          antecedencia_agendamento?: number | null
          antecedencia_cancelamento?: number | null
          avatar_url?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          especialidades?: string[] | null
          estado?: string | null
          id?: string
          nome?: string
          notificacoes?: Json | null
          pais?: string | null
          perfil_ativo?: boolean | null
          profession_id?: string | null
          profissao?: string | null
          rating_average?: number | null
          rating_count?: number | null
          registro?: string | null
          specialization_ids?: string[] | null
          target_audience_ids?: string[] | null
          telefone?: string | null
          tipo_atendimento?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          antecedencia_minima: number | null
          client_id: string
          comprovante_anexo: string | null
          data_criacao: string
          data_resposta: string | null
          descricao_acordo: string | null
          id: string
          prazo_cancelamento: number | null
          professional_id: string
          quantidade_gcoins: number
          status: string
          valor_acordado: number
        }
        Insert: {
          antecedencia_minima?: number | null
          client_id: string
          comprovante_anexo?: string | null
          data_criacao?: string
          data_resposta?: string | null
          descricao_acordo?: string | null
          id?: string
          prazo_cancelamento?: number | null
          professional_id: string
          quantidade_gcoins: number
          status?: string
          valor_acordado: number
        }
        Update: {
          antecedencia_minima?: number | null
          client_id?: string
          comprovante_anexo?: string | null
          data_criacao?: string
          data_resposta?: string | null
          descricao_acordo?: string | null
          id?: string
          prazo_cancelamento?: number | null
          professional_id?: string
          quantidade_gcoins?: number
          status?: string
          valor_acordado?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      secretary_links: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          professional_id: string
          secretary_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          professional_id: string
          secretary_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          professional_id?: string
          secretary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_links_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_links_secretary_id_fkey"
            columns: ["secretary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specializations: {
        Row: {
          ativa: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          profession_id: string | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          profession_id?: string | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          profession_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specializations_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      target_audiences: {
        Row: {
          ativa: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_admins: { Args: never; Returns: number }
      get_my_profile_id: { Args: never; Returns: string }
      has_client_link: { Args: { prof_id: string }; Returns: boolean }
      has_professional_link: { Args: { cli_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_content_views: {
        Args: { content_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_dependent_of: { Args: { resp_id: string }; Returns: boolean }
      is_professional_profile: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      is_secretary_of: { Args: { prof_id: string }; Returns: boolean }
      is_within_cancellation_window: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_professional_id: string
        }
        Returns: boolean
      }
      promote_user_to_admin: { Args: { user_email: string }; Returns: Json }
    }
    Enums: {
      app_role:
      | "cliente"
      | "profissional"
      | "dependente"
      | "secretaria"
      | "admin"
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
      app_role: [
        "cliente",
        "profissional",
        "dependente",
        "secretaria",
        "admin",
      ],
    },
  },
} as const
