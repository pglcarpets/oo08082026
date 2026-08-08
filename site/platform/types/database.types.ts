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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      _local_migration_history: {
        Row: {
          applied_at: string
          filename: string
        }
        Insert: {
          applied_at?: string
          filename: string
        }
        Update: {
          applied_at?: string
          filename?: string
        }
        Relationships: []
      }
      block_descriptors: {
        Row: {
          current_checksum: string | null
          current_version: number
          descriptor: Json
          lifecycle: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_checksum?: string | null
          current_version: number
          descriptor: Json
          lifecycle?: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_checksum?: string | null
          current_version?: number
          descriptor?: Json
          lifecycle?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      block_themes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tokens: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tokens: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tokens?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      business_stats_current: {
        Row: {
          as_of_date: string
          client_organisations: number
          id: string
          is_active: boolean
          locations_served: number
          projects_delivered: number
          sectors_served: number
          source_note: string | null
          updated_at: string
          updated_by: string | null
          years_experience: number
        }
        Insert: {
          as_of_date: string
          client_organisations: number
          id?: string
          is_active?: boolean
          locations_served: number
          projects_delivered: number
          sectors_served: number
          source_note?: string | null
          updated_at?: string
          updated_by?: string | null
          years_experience: number
        }
        Update: {
          as_of_date?: string
          client_organisations?: number
          id?: string
          is_active?: boolean
          locations_served?: number
          projects_delivered?: number
          sectors_served?: number
          source_note?: string | null
          updated_at?: string
          updated_by?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      business_stats_history: {
        Row: {
          as_of_date: string
          business_stats_id: string
          changed_at: string
          client_organisations: number
          history_id: string
          locations_served: number
          projects_delivered: number
          sectors_served: number
          source_note: string | null
          updated_at: string
          updated_by: string | null
          years_experience: number
        }
        Insert: {
          as_of_date: string
          business_stats_id: string
          changed_at?: string
          client_organisations: number
          history_id?: string
          locations_served: number
          projects_delivered: number
          sectors_served: number
          source_note?: string | null
          updated_at: string
          updated_by?: string | null
          years_experience: number
        }
        Update: {
          as_of_date?: string
          business_stats_id?: string
          changed_at?: string
          client_organisations?: number
          history_id?: string
          locations_served?: number
          projects_delivered?: number
          sectors_served?: number
          source_note?: string | null
          updated_at?: string
          updated_by?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          canonical_id: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          canonical_id?: string | null
          description?: string | null
          id: string
          name: string
        }
        Update: {
          canonical_id?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          category: string
          color: string | null
          created_at: string
          depth_cm: number
          description: string | null
          height_cm: number
          id: string
          image_url: string | null
          model_url: string | null
          name: string
          price: number | null
          seat_count: number | null
          series_id: string | null
          shape: string | null
          sub_category: string | null
          width_cm: number
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          depth_cm: number
          description?: string | null
          height_cm: number
          id: string
          image_url?: string | null
          model_url?: string | null
          name: string
          price?: number | null
          seat_count?: number | null
          series_id?: string | null
          shape?: string | null
          sub_category?: string | null
          width_cm: number
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          depth_cm?: number
          description?: string | null
          height_cm?: number
          id?: string
          image_url?: string | null
          model_url?: string | null
          name?: string
          price?: number | null
          seat_count?: number | null
          series_id?: string | null
          shape?: string | null
          sub_category?: string | null
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_series_id_series_id_fk"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product_images: {
        Row: {
          created_at: string
          id: string
          image_kind: string
          image_url: string
          product_id: string
          sort_order: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_kind?: string
          image_url: string
          product_id: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_kind?: string
          image_url?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product_slug_aliases: {
        Row: {
          alias_slug: string
          canonical_slug: string
          created_at: string
          id: string
          is_active: boolean
          reason: string
          updated_at: string
        }
        Insert: {
          alias_slug: string
          canonical_slug: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string
          updated_at?: string
        }
        Update: {
          alias_slug?: string
          canonical_slug?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_slug_aliases_canonical_slug_fkey"
            columns: ["canonical_slug"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_slug_aliases_canonical_slug_fkey"
            columns: ["canonical_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      catalog_product_specs: {
        Row: {
          created_at: string
          product_id: string
          source: string
          specs: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          product_id: string
          source?: string
          specs?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          product_id?: string
          source?: string
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_products: {
        Row: {
          "3d_model": string | null
          alt_text: string | null
          canonical_category_id: string | null
          canonical_series_id: string | null
          canonical_slug_v2: string | null
          canonical_subcategory_id: string | null
          canonical_subcategory_label: string | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          detailed_info: Json | null
          flagship_image: string | null
          id: string
          images: Json | null
          metadata: Json | null
          name: string
          normalized_name_key: string | null
          performance_tier: string | null
          scene_images: string[] | null
          series_id: string | null
          series_name: string | null
          slug: string
          specs: Json | null
          variants: Json | null
        }
        Insert: {
          "3d_model"?: string | null
          alt_text?: string | null
          canonical_category_id?: string | null
          canonical_series_id?: string | null
          canonical_slug_v2?: string | null
          canonical_subcategory_id?: string | null
          canonical_subcategory_label?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          detailed_info?: Json | null
          flagship_image?: string | null
          id?: string
          images?: Json | null
          metadata?: Json | null
          name: string
          normalized_name_key?: string | null
          performance_tier?: string | null
          scene_images?: string[] | null
          series_id?: string | null
          series_name?: string | null
          slug: string
          specs?: Json | null
          variants?: Json | null
        }
        Update: {
          "3d_model"?: string | null
          alt_text?: string | null
          canonical_category_id?: string | null
          canonical_series_id?: string | null
          canonical_slug_v2?: string | null
          canonical_subcategory_id?: string | null
          canonical_subcategory_label?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          detailed_info?: Json | null
          flagship_image?: string | null
          id?: string
          images?: Json | null
          metadata?: Json | null
          name?: string
          normalized_name_key?: string | null
          performance_tier?: string | null
          scene_images?: string[] | null
          series_id?: string | null
          series_name?: string | null
          slug?: string
          specs?: Json | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      configurator_products: {
        Row: {
          active: boolean
          brand_name: string | null
          category: string
          created_at: string
          default_footprint: Json | null
          derived_rules: Json | null
          description: string | null
          family: string | null
          id: string
          materials: string[]
          model_3d_url: string | null
          name: string
          size_options: Json
          sizing_type: string
          slug: string
          thumbnail_url: string | null
          updated_at: string
          workstation: Json | null
        }
        Insert: {
          active?: boolean
          brand_name?: string | null
          category: string
          created_at?: string
          default_footprint?: Json | null
          derived_rules?: Json | null
          description?: string | null
          family?: string | null
          id?: string
          materials?: string[]
          model_3d_url?: string | null
          name: string
          size_options?: Json
          sizing_type: string
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
          workstation?: Json | null
        }
        Update: {
          active?: boolean
          brand_name?: string | null
          category?: string
          created_at?: string
          default_footprint?: Json | null
          derived_rules?: Json | null
          description?: string | null
          family?: string | null
          id?: string
          materials?: string[]
          model_3d_url?: string | null
          name?: string
          size_options?: Json
          sizing_type?: string
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
          workstation?: Json | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string
          enabled: boolean
          key: string
          module_group: string
          rollout_percentage: number
          updated_at: string
        }
        Insert: {
          description?: string
          enabled?: boolean
          key: string
          module_group?: string
          rollout_percentage?: number
          updated_at?: string
        }
        Update: {
          description?: string
          enabled?: boolean
          key?: string
          module_group?: string
          rollout_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      furniture_catalog: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          dimensions: Json
          front_fabric_json: Json | null
          front_png_url: string | null
          id: string
          is_custom: boolean
          name: string
          notes: string | null
          side_fabric_json: Json | null
          side_png_url: string | null
          subcategory: string | null
          tags: string[]
          thumbnail_url: string | null
          top_fabric_json: Json | null
          top_png_checksum: string | null
          top_png_url: string | null
          top_svg_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          dimensions?: Json
          front_fabric_json?: Json | null
          front_png_url?: string | null
          id: string
          is_custom?: boolean
          name: string
          notes?: string | null
          side_fabric_json?: Json | null
          side_png_url?: string | null
          subcategory?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          top_fabric_json?: Json | null
          top_png_checksum?: string | null
          top_png_url?: string | null
          top_svg_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          dimensions?: Json
          front_fabric_json?: Json | null
          front_png_url?: string | null
          id?: string
          is_custom?: boolean
          name?: string
          notes?: string | null
          side_fabric_json?: Json | null
          side_png_url?: string | null
          subcategory?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          top_fabric_json?: Json | null
          top_png_checksum?: string | null
          top_png_url?: string | null
          top_svg_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      planner_managed_products: {
        Row: {
          active: boolean
          category: string
          category_id: string
          category_name: string
          created_at: string
          created_by: string | null
          description: string
          flagship_image: string
          id: string
          images: string[]
          legacy_product_id: string | null
          metadata: Json
          name: string
          planner_source_slug: string
          price: number
          published_svg_revision_id: string | null
          series_id: string
          series_name: string
          slug: string
          specs: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          category_id: string
          category_name: string
          created_at?: string
          created_by?: string | null
          description?: string
          flagship_image?: string
          id?: string
          images?: string[]
          legacy_product_id?: string | null
          metadata?: Json
          name: string
          planner_source_slug: string
          price?: number
          published_svg_revision_id?: string | null
          series_id: string
          series_name: string
          slug: string
          specs?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          category_id?: string
          category_name?: string
          created_at?: string
          created_by?: string | null
          description?: string
          flagship_image?: string
          id?: string
          images?: string[]
          legacy_product_id?: string | null
          metadata?: Json
          name?: string
          planner_source_slug?: string
          price?: number
          published_svg_revision_id?: string | null
          series_id?: string
          series_name?: string
          slug?: string
          specs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          tier: Database["public"]["Enums"]["tier"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          image_url?: string | null
          name: string
          tier: Database["public"]["Enums"]["tier"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          tier?: Database["public"]["Enums"]["tier"]
        }
        Relationships: []
      }
      svg_revision_artifacts: {
        Row: {
          checksum: string
          created_at: string
          id: string
          kind: string
          revision_id: string
          storage_key: string
          width: number | null
        }
        Insert: {
          checksum: string
          created_at?: string
          id?: string
          kind: string
          revision_id: string
          storage_key: string
          width?: number | null
        }
        Update: {
          checksum?: string
          created_at?: string
          id?: string
          kind?: string
          revision_id?: string
          storage_key?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "svg_revision_artifacts_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "svg_revisions"
            referencedColumns: ["revision_id"]
          },
        ]
      }
      svg_revisions: {
        Row: {
          actor_id: string
          artifact_checksums: Json | null
          compiler_version: string | null
          definition: Json
          definition_type_id: string
          definition_version: number
          published_at: string
          reason: string | null
          released_product: Json | null
          revision_id: string
          schema_version: number
          slug: string
          source_revision: number | null
          validation: Json | null
          version: number
        }
        Insert: {
          actor_id: string
          artifact_checksums?: Json | null
          compiler_version?: string | null
          definition: Json
          definition_type_id: string
          definition_version: number
          published_at?: string
          reason?: string | null
          released_product?: Json | null
          revision_id: string
          schema_version: number
          slug: string
          source_revision?: number | null
          validation?: Json | null
          version: number
        }
        Update: {
          actor_id?: string
          artifact_checksums?: Json | null
          compiler_version?: string | null
          definition?: Json
          definition_type_id?: string
          definition_version?: number
          published_at?: string
          reason?: string | null
          released_product?: Json | null
          revision_id?: string
          schema_version?: number
          slug?: string
          source_revision?: number | null
          validation?: Json | null
          version?: number
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          description: string
          furniture_count: number
          id: string
          layout_json: string
          name: string
          room_depth_cm: number
          room_width_cm: number
          thumbnail_svg: string | null
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          furniture_count?: number
          id: string
          layout_json: string
          name: string
          room_depth_cm: number
          room_width_cm: number
          thumbnail_svg?: string | null
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          furniture_count?: number
          id?: string
          layout_json?: string
          name?: string
          room_depth_cm?: number
          room_width_cm?: number
          thumbnail_svg?: string | null
          usage_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      categories: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      product_canonical_slug_v2_collisions: {
        Row: {
          canonical_slug_v2: string | null
          legacy_slugs: string[] | null
          row_count: number | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string | null
          image_kind: string | null
          image_url: string | null
          product_id: string | null
          sort_order: number | null
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          image_kind?: string | null
          image_url?: string | null
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          image_kind?: string | null
          image_url?: string | null
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_name_collisions: {
        Row: {
          category_id: string | null
          normalized_name_key: string | null
          row_count: number | null
          slugs: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_slug_aliases: {
        Row: {
          alias_slug: string | null
          canonical_slug: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          alias_slug?: string | null
          canonical_slug?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          alias_slug?: string | null
          canonical_slug?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_slug_aliases_canonical_slug_fkey"
            columns: ["canonical_slug"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_slug_aliases_canonical_slug_fkey"
            columns: ["canonical_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string | null
          product_id: string | null
          source: string | null
          specs: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          product_id?: string | null
          source?: string | null
          specs?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          product_id?: string | null
          source?: string | null
          specs?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          "3d_model": string | null
          alt_text: string | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          detailed_info: Json | null
          flagship_image: string | null
          id: string | null
          images: Json | null
          metadata: Json | null
          name: string | null
          normalized_name_key: string | null
          performance_tier: string | null
          scene_images: string[] | null
          series_id: string | null
          series_name: string | null
          slug: string | null
          specs: Json | null
          variants: Json | null
        }
        Insert: {
          "3d_model"?: string | null
          alt_text?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          detailed_info?: Json | null
          flagship_image?: string | null
          id?: string | null
          images?: Json | null
          metadata?: Json | null
          name?: string | null
          normalized_name_key?: string | null
          performance_tier?: string | null
          scene_images?: string[] | null
          series_id?: string | null
          series_name?: string | null
          slug?: string | null
          specs?: Json | null
          variants?: Json | null
        }
        Update: {
          "3d_model"?: string | null
          alt_text?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          detailed_info?: Json | null
          flagship_image?: string | null
          id?: string | null
          images?: Json | null
          metadata?: Json | null
          name?: string | null
          normalized_name_key?: string | null
          performance_tier?: string | null
          scene_images?: string[] | null
          series_id?: string | null
          series_name?: string | null
          slug?: string | null
          specs?: Json | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      catalog_slugify_token: { Args: { source_value: string }; Returns: string }
      catalog_subcategory_label: {
        Args: { source_category_id: string; source_subcategory_id: string }
        Returns: string
      }
      compute_catalog_series_id: {
        Args: {
          source_category_id: string
          source_series_name: string
          source_subcategory_id: string
        }
        Returns: string
      }
      compute_catalog_slug_v2: {
        Args: {
          source_category_id: string
          source_name: string
          source_subcategory_id: string
        }
        Returns: string
      }
      compute_normalized_product_name_key: {
        Args: { source_name: string }
        Returns: string
      }
      normalize_catalog_category_id: {
        Args: { source_category_id: string }
        Returns: string
      }
      normalize_catalog_subcategory_id: {
        Args: {
          source_category_id: string
          source_metadata?: Json
          source_product_name?: string
          source_subcategory_label: string
        }
        Returns: string
      }
    }
    Enums: {
      tier: "economy" | "medium" | "premium"
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
      tier: ["economy", "medium", "premium"],
    },
  },
} as const
