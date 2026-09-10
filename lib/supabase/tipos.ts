export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          creada_en: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: number
          perfil_id: string | null
          registro_id: string | null
          tabla: string
        }
        Insert: {
          accion: string
          creada_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          perfil_id?: string | null
          registro_id?: string | null
          tabla: string
        }
        Update: {
          accion?: string
          creada_en?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: number
          perfil_id?: string | null
          registro_id?: string | null
          tabla?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          hogar_id: string
          id: string
          nombre: string
          padre_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          hogar_id: string
          id?: string
          nombre: string
          padre_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          hogar_id?: string
          id?: string
          nombre?: string
          padre_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "categorias_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas: {
        Row: {
          activa: boolean
          creada_en: string
          hogar_id: string
          id: string
          moneda: string
          nombre: string
          perfil_id: string
          saldo_inicial: number
          tipo: Database["public"]["Enums"]["tipo_cuenta"]
          visibilidad: Database["public"]["Enums"]["visibilidad"]
        }
        Insert: {
          activa?: boolean
          creada_en?: string
          hogar_id: string
          id?: string
          moneda?: string
          nombre: string
          perfil_id: string
          saldo_inicial?: number
          tipo: Database["public"]["Enums"]["tipo_cuenta"]
          visibilidad?: Database["public"]["Enums"]["visibilidad"]
        }
        Update: {
          activa?: boolean
          creada_en?: string
          hogar_id?: string
          id?: string
          moneda?: string
          nombre?: string
          perfil_id?: string
          saldo_inicial?: number
          tipo?: Database["public"]["Enums"]["tipo_cuenta"]
          visibilidad?: Database["public"]["Enums"]["visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hogares: {
        Row: {
          codigo_invitacion: string
          creado_en: string
          id: string
          nombre: string
        }
        Insert: {
          codigo_invitacion?: string
          creado_en?: string
          id?: string
          nombre: string
        }
        Update: {
          codigo_invitacion?: string
          creado_en?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          creado_en: string
          hogar_id: string
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          hogar_id: string
          id: string
          nombre: string
        }
        Update: {
          creado_en?: string
          hogar_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          categoria_id: string
          id: string
          monto_limite: number
          perfil_id: string
          periodo: string
        }
        Insert: {
          categoria_id: string
          id?: string
          monto_limite: number
          perfil_id: string
          periodo: string
        }
        Update: {
          categoria_id?: string
          id?: string
          monto_limite?: number
          perfil_id?: string
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones: {
        Row: {
          categoria_id: string | null
          creada_en: string
          cuenta_destino_id: string | null
          cuenta_id: string
          descripcion: string | null
          fecha: string
          hogar_id: string
          id: string
          monto: number
          origen: Database["public"]["Enums"]["origen_registro"]
          perfil_id: string
          referencia_externa: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          categoria_id?: string | null
          creada_en?: string
          cuenta_destino_id?: string | null
          cuenta_id: string
          descripcion?: string | null
          fecha?: string
          hogar_id: string
          id?: string
          monto: number
          origen?: Database["public"]["Enums"]["origen_registro"]
          perfil_id: string
          referencia_externa?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          categoria_id?: string | null
          creada_en?: string
          cuenta_destino_id?: string | null
          cuenta_id?: string
          descripcion?: string | null
          fecha?: string
          hogar_id?: string
          id?: string
          monto?: number
          origen?: Database["public"]["Enums"]["origen_registro"]
          perfil_id?: string
          referencia_externa?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_cuenta_destino_id_fkey"
            columns: ["cuenta_destino_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mi_hogar: { Args: never; Returns: string }
      resumen_hogar: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          categoria: string
          nombre: string
          perfil_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          total: number
        }[]
      }
    }
    Enums: {
      origen_registro: "manual" | "correo" | "importado"
      tipo_cuenta:
        | "efectivo"
        | "ahorro"
        | "corriente"
        | "tarjeta_credito"
        | "inversion"
      tipo_movimiento: "ingreso" | "gasto" | "transferencia"
      visibilidad: "privada" | "compartida"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      origen_registro: ["manual", "correo", "importado"],
      tipo_cuenta: [
        "efectivo",
        "ahorro",
        "corriente",
        "tarjeta_credito",
        "inversion",
      ],
      tipo_movimiento: ["ingreso", "gasto", "transferencia"],
      visibilidad: ["privada", "compartida"],
    },
  },
} as const

