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
      _local_migration_history: {
        Row: {
          filename: string
          applied_at: string
        }
        Insert: {
          filename: string
          applied_at?: string
        }
        Update: {
          filename?: string
          applied_at?: string
        }
        Relationships: []
      }
      admin_modules: {
        Row: {
          id: string
          label: string
          description: string
          href: string
          flag_key: string
          nav_group: string
          sort_order: number
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          label: string
          description?: string
          href: string
          flag_key: string
          nav_group?: string
          sort_order?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          description?: string
          href?: string
          flag_key?: string
          nav_group?: string
          sort_order?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_modules_flag_key_fkey"
            columns: ["flag_key"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["key"]
          }
        ]
      }
      audit_events: {
        Row: {
          id: string
          team_id: string
          actor_id: string
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          actor_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          actor_id?: string
          action?: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      block_descriptors: {
        Row: {
          slug: string
          current_version: number
          current_checksum: string | null
          descriptor: Json
          lifecycle: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          slug: string
          current_version: number
          current_checksum?: string | null
          descriptor: Json
          lifecycle?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          slug?: string
          current_version?: number
          current_checksum?: string | null
          descriptor?: Json
          lifecycle?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_queries: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          source: string
          source_path: string | null
          name: string
          company: string | null
          email: string | null
          phone: string | null
          preferred_contact: string
          message: string
          requirement: string | null
          budget: string | null
          timeline: string | null
          status: string
          followup_channel: string
          followup_target: string | null
          followup_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          source?: string
          source_path?: string | null
          name: string
          company?: string | null
          email?: string | null
          phone?: string | null
          preferred_contact?: string
          message: string
          requirement?: string | null
          budget?: string | null
          timeline?: string | null
          status?: string
          followup_channel?: string
          followup_target?: string | null
          followup_notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          source?: string
          source_path?: string | null
          name?: string
          company?: string | null
          email?: string | null
          phone?: string | null
          preferred_contact?: string
          message?: string
          requirement?: string | null
          budget?: string | null
          timeline?: string | null
          status?: string
          followup_channel?: string
          followup_target?: string | null
          followup_notes?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          key: string
          enabled: boolean
          rollout_percentage: number
          description: string
          module_group: string
          updated_at: string
        }
        Insert: {
          key: string
          enabled?: boolean
          rollout_percentage?: number
          description?: string
          module_group?: string
          updated_at?: string
        }
        Update: {
          key?: string
          enabled?: boolean
          rollout_percentage?: number
          description?: string
          module_group?: string
          updated_at?: string
        }
        Relationships: []
      }
      furniture_catalog: {
        Row: {
          id: string
          name: string
          category: string
          subcategory: string | null
          tags: string[]
          dimensions: Json
          notes: string | null
          is_custom: boolean
          thumbnail_url: string | null
          top_png_url: string | null
          top_svg_url: string | null
          front_png_url: string | null
          side_png_url: string | null
          top_png_checksum: string | null
          top_fabric_json: Json | null
          front_fabric_json: Json | null
          side_fabric_json: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          category?: string
          subcategory?: string | null
          tags?: string[]
          dimensions?: Json
          notes?: string | null
          is_custom?: boolean
          thumbnail_url?: string | null
          top_png_url?: string | null
          top_svg_url?: string | null
          front_png_url?: string | null
          side_png_url?: string | null
          top_png_checksum?: string | null
          top_fabric_json?: Json | null
          front_fabric_json?: Json | null
          side_fabric_json?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          subcategory?: string | null
          tags?: string[]
          dimensions?: Json
          notes?: string | null
          is_custom?: boolean
          thumbnail_url?: string | null
          top_png_url?: string | null
          top_svg_url?: string | null
          front_png_url?: string | null
          side_png_url?: string | null
          top_png_checksum?: string | null
          top_fabric_json?: Json | null
          front_fabric_json?: Json | null
          side_fabric_json?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          team_id: string | null
          email: string
          token: string
          role: string | null
          expires_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          email: string
          token?: string
          role?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          email?: string
          token?: string
          role?: string | null
          expires_at?: string | null
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      oando_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          engine: string
          payload: Json
          thumbnail_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          engine: string
          payload?: Json
          thumbnail_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          engine?: string
          payload?: Json
          thumbnail_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oando_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      offices: {
        Row: {
          id: string
          team_id: string | null
          name: string
          slug: string
          payload: Json | null
          tldraw_payload: Json | null
          draft_payload: Json | null
          zone_graph: Json | null
          babylon_config: Json | null
          floor_count: number | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          name: string
          slug: string
          payload?: Json | null
          tldraw_payload?: Json | null
          draft_payload?: Json | null
          zone_graph?: Json | null
          babylon_config?: Json | null
          floor_count?: number | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          name?: string
          slug?: string
          payload?: Json | null
          tldraw_payload?: Json | null
          draft_payload?: Json | null
          zone_graph?: Json | null
          babylon_config?: Json | null
          floor_count?: number | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_handoffs: {
        Row: {
          id: string
          reference_id: string
          idempotency_key: string
          project_id: string
          project_name: string
          calculation_hash: string
          contact: Json
          boq: Json
          project_notes: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference_id: string
          idempotency_key: string
          project_id?: string
          project_name?: string
          calculation_hash?: string
          contact?: Json
          boq?: Json
          project_notes?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference_id?: string
          idempotency_key?: string
          project_id?: string
          project_name?: string
          calculation_hash?: string
          contact?: Json
          boq?: Json
          project_notes?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      planner_settings: {
        Row: {
          id: string
          units: string
          show_measurements: boolean
          grid_size_mm: number
          snap_to_grid: boolean
          show_grid: boolean
          default_room_width_mm: number
          default_room_depth_mm: number
          enabled_tools: string[]
          show_3d: boolean
          show_iso: boolean
          default_zoom: number
          show_contact_shadows: boolean
          max_items_per_plan: number
          max_plans_per_user: number
          show_prices: boolean
          show_lead_time: boolean
          show_pdf_source: boolean
          allow_png_export: boolean
          allow_pdf_export: boolean
          allow_share_link: boolean
          show_watermark: boolean
          default_plan_name: string
          empty_state_heading: string
          empty_state_body: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          units?: string
          show_measurements?: boolean
          grid_size_mm?: number
          snap_to_grid?: boolean
          show_grid?: boolean
          default_room_width_mm?: number
          default_room_depth_mm?: number
          enabled_tools?: string[]
          show_3d?: boolean
          show_iso?: boolean
          default_zoom?: number
          show_contact_shadows?: boolean
          max_items_per_plan?: number
          max_plans_per_user?: number
          show_prices?: boolean
          show_lead_time?: boolean
          show_pdf_source?: boolean
          allow_png_export?: boolean
          allow_pdf_export?: boolean
          allow_share_link?: boolean
          show_watermark?: boolean
          default_plan_name?: string
          empty_state_heading?: string
          empty_state_body?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          units?: string
          show_measurements?: boolean
          grid_size_mm?: number
          snap_to_grid?: boolean
          show_grid?: boolean
          default_room_width_mm?: number
          default_room_depth_mm?: number
          enabled_tools?: string[]
          show_3d?: boolean
          show_iso?: boolean
          default_zoom?: number
          show_contact_shadows?: boolean
          max_items_per_plan?: number
          max_plans_per_user?: number
          show_prices?: boolean
          show_lead_time?: boolean
          show_pdf_source?: boolean
          allow_png_export?: boolean
          allow_pdf_export?: boolean
          allow_share_link?: boolean
          show_watermark?: boolean
          default_plan_name?: string
          empty_state_heading?: string
          empty_state_body?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      price_book_versions: {
        Row: {
          id: string
          book_row_id: string
          version_id: string
          effective_from: string
          currency: string
          status: string
          rules: Json
          created_at: string
        }
        Insert: {
          id?: string
          book_row_id: string
          version_id: string
          effective_from: string
          currency: string
          status?: string
          rules?: Json
          created_at?: string
        }
        Update: {
          id?: string
          book_row_id?: string
          version_id?: string
          effective_from?: string
          currency?: string
          status?: string
          rules?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_book_versions_book_row_id_fkey"
            columns: ["book_row_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["id"]
          }
        ]
      }
      price_books: {
        Row: {
          id: string
          family_slug: string
          book_id: string
          active_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_slug: string
          book_id: string
          active_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_slug?: string
          book_id?: string
          active_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_studio_drafts: {
        Row: {
          slug: string
          schema_version: number
          revision: number
          draft: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          slug: string
          schema_version: number
          revision?: number
          draft: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          slug?: string
          schema_version?: number
          revision?: number
          draft?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      product_studio_template_audit: {
        Row: {
          id: string
          template_id: string
          revision: number
          action: string
          snapshot: Json
          actor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          revision: number
          action: string
          snapshot: Json
          actor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          revision?: number
          action?: string
          snapshot?: Json
          actor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_studio_template_audit_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "product_studio_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      product_studio_templates: {
        Row: {
          id: string
          name: string
          normalized_name: string
          tags: string[]
          fragment: Json
          schema_version: number
          revision: number
          archived_at: string | null
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          normalized_name: string
          tags?: string[]
          fragment: Json
          schema_version: number
          revision?: number
          archived_at?: string | null
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          normalized_name?: string
          tags?: string[]
          fragment?: Json
          schema_version?: number
          revision?: number
          archived_at?: string | null
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          role: string | null
          joined_at: string | null
        }
        Insert: {
          team_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
        }
        Update: {
          team_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
        }
        Relationships: []
      }
      user_history: {
        Row: {
          user_id: string
          viewed_products: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          viewed_products?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          viewed_products?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_editor_config_audit: {
        Row: {
          id: string
          config_id: string
          workspace: string
          profile_key: string
          revision: number
          action: string
          payload: Json
          actor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          config_id: string
          workspace: string
          profile_key: string
          revision: number
          action: string
          payload: Json
          actor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          workspace?: string
          profile_key?: string
          revision?: number
          action?: string
          payload?: Json
          actor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_editor_config_audit_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "workspace_editor_configs"
            referencedColumns: ["id"]
          }
        ]
      }
      workspace_editor_configs: {
        Row: {
          id: string
          workspace: string
          profile_key: string
          schema_version: number
          revision: number
          active: boolean
          payload: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          workspace: string
          profile_key: string
          schema_version: number
          revision?: number
          active?: boolean
          payload: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          workspace?: string
          profile_key?: string
          schema_version?: number
          revision?: number
          active?: boolean
          payload?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
