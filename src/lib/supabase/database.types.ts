export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      approval_events: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"];
          actor_id: string | null;
          created_at: string;
          id: string;
          reason: string | null;
          reservation_id: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["approval_action"];
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          reason?: string | null;
          reservation_id: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["approval_action"];
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          reason?: string | null;
          reservation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_events_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment: {
        Row: {
          block: string | null;
          created_at: string;
          id: string;
          image_path: string | null;
          name: string;
          room_id: string | null;
          status: Database["public"]["Enums"]["entity_status"];
          type: string;
          updated_at: string;
        };
        Insert: {
          block?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          name: string;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["entity_status"];
          type: string;
          updated_at?: string;
        };
        Update: {
          block?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          name?: string;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["entity_status"];
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          channel_app: boolean;
          channel_email: boolean;
          event_type: string;
          user_id: string;
        };
        Insert: {
          channel_app?: boolean;
          channel_email?: boolean;
          event_type: string;
          user_id: string;
        };
        Update: {
          channel_app?: boolean;
          channel_email?: boolean;
          event_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          related_reservation_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          related_reservation_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          related_reservation_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_related_reservation_id_fkey";
            columns: ["related_reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          department: string | null;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          siape_matricula: string | null;
          status: Database["public"]["Enums"]["account_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department?: string | null;
          email: string;
          full_name: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          siape_matricula?: string | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          siape_matricula?: string | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_holds: {
        Row: {
          created_at: string;
          end_time: string;
          equipment_id: string | null;
          expires_at: string;
          id: string;
          reservation_date: string;
          resource_kind: Database["public"]["Enums"]["resource_kind"];
          room_id: string | null;
          start_time: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          equipment_id?: string | null;
          expires_at: string;
          id?: string;
          reservation_date: string;
          resource_kind: Database["public"]["Enums"]["resource_kind"];
          room_id?: string | null;
          start_time: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          equipment_id?: string | null;
          expires_at?: string;
          id?: string;
          reservation_date?: string;
          resource_kind?: Database["public"]["Enums"]["resource_kind"];
          room_id?: string | null;
          start_time?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_holds_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservation_holds_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservation_holds_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          created_at: string;
          end_time: string;
          equipment_id: string | null;
          id: string;
          purpose: string | null;
          recurrence_group_id: string | null;
          recurrence_type: Database["public"]["Enums"]["recurrence_type"];
          reservation_date: string;
          resource_kind: Database["public"]["Enums"]["resource_kind"];
          room_id: string | null;
          start_time: string;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          equipment_id?: string | null;
          id?: string;
          purpose?: string | null;
          recurrence_group_id?: string | null;
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"];
          reservation_date: string;
          resource_kind: Database["public"]["Enums"]["resource_kind"];
          room_id?: string | null;
          start_time: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          equipment_id?: string | null;
          id?: string;
          purpose?: string | null;
          recurrence_group_id?: string | null;
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"];
          reservation_date?: string;
          resource_kind?: Database["public"]["Enums"]["resource_kind"];
          room_id?: string | null;
          start_time?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          block: string | null;
          capacity: number;
          created_at: string;
          id: string;
          image_path: string | null;
          name: string;
          resources: Json;
          status: Database["public"]["Enums"]["entity_status"];
          type: Database["public"]["Enums"]["room_type"];
          updated_at: string;
        };
        Insert: {
          block?: string | null;
          capacity: number;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          name: string;
          resources?: Json;
          status?: Database["public"]["Enums"]["entity_status"];
          type: Database["public"]["Enums"]["room_type"];
          updated_at?: string;
        };
        Update: {
          block?: string | null;
          capacity?: number;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          name?: string;
          resources?: Json;
          status?: Database["public"]["Enums"]["entity_status"];
          type?: Database["public"]["Enums"]["room_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      signup_requests: {
        Row: {
          created_at: string;
          department: string | null;
          email: string;
          full_name: string;
          id: string;
          motivo: string | null;
          reason: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["signup_status"];
        };
        Insert: {
          created_at?: string;
          department?: string | null;
          email: string;
          full_name: string;
          id?: string;
          motivo?: string | null;
          reason?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["signup_status"];
        };
        Update: {
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          motivo?: string | null;
          reason?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["signup_status"];
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          density: Database["public"]["Enums"]["density_pref"];
          language: Database["public"]["Enums"]["language_pref"];
          reduce_motion: boolean;
          theme: Database["public"]["Enums"]["theme_pref"];
          two_factor_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          density?: Database["public"]["Enums"]["density_pref"];
          language?: Database["public"]["Enums"]["language_pref"];
          reduce_motion?: boolean;
          theme?: Database["public"]["Enums"]["theme_pref"];
          two_factor_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          density?: Database["public"]["Enums"]["density_pref"];
          language?: Database["public"]["Enums"]["language_pref"];
          reduce_motion?: boolean;
          theme?: Database["public"]["Enums"]["theme_pref"];
          two_factor_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      check_resource_availability: {
        Args: {
          p_resource_kind: Database["public"]["Enums"]["resource_kind"];
          p_room_id: string | null;
          p_equipment_id: string | null;
          p_date: string;
          p_start: string;
          p_end: string;
          p_exclude_reservation?: string | null;
        };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      reservation_counts_by_user: {
        Args: Record<PropertyKey, never>;
        Returns: { user_id: string; total: number }[];
      };
      reservation_counts_by_resource: {
        Args: { p_kind: Database["public"]["Enums"]["resource_kind"] };
        Returns: { resource_id: string; total: number }[];
      };
      search_available_rooms: {
        Args: {
          p_date: string;
          p_start: string;
          p_end: string;
          p_type?: Database["public"]["Enums"]["room_type"] | null;
          p_resources?: string[];
        };
        Returns: Database["public"]["Tables"]["rooms"]["Row"][];
      };
      search_available_equipment: {
        Args: {
          p_date: string;
          p_start: string;
          p_end: string;
          p_type?: string | null;
        };
        Returns: Database["public"]["Tables"]["equipment"]["Row"][];
      };
    };
    Enums: {
      account_status: "active" | "inactive";
      approval_action: "submitted" | "approved" | "rejected";
      density_pref: "comfortable" | "compact";
      entity_status: "active" | "inactive" | "maintenance";
      language_pref: "pt-BR" | "en" | "es";
      recurrence_type: "none" | "daily" | "weekly" | "custom";
      reservation_status: "pending" | "approved" | "rejected" | "cancelled";
      resource_kind: "room" | "equipment";
      room_type: "sala" | "laboratorio" | "auditorio";
      signup_status: "pending" | "approved" | "rejected";
      theme_pref: "light" | "dark" | "system";
      user_role: "admin" | "professor";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T];
