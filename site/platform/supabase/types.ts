export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      image_assets: {
        Row: {
          id: string;
          url: string;
          storage_path: string | null;
          prompt: string | null;
          endpoint: string | null;
          product_id: string | null;
          asset_type: 'hero' | 'product' | 'lifestyle' | 'cutout' | 'banner' | null;
          width: number | null;
          height: number | null;
          file_size_bytes: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          storage_path?: string | null;
          prompt?: string | null;
          endpoint?: string | null;
          product_id?: string | null;
          asset_type?: 'hero' | 'product' | 'lifestyle' | 'cutout' | 'banner' | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          storage_path?: string | null;
          prompt?: string | null;
          endpoint?: string | null;
          product_id?: string | null;
          asset_type?: 'hero' | 'product' | 'lifestyle' | 'cutout' | 'banner' | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
