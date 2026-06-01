import type { Database } from "./types.js";

export type SupabaseClientPlaceholder = {
  readonly database: Database;
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
};

export function createSupabaseClientPlaceholder(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClientPlaceholder {
  return {
    database: {
      public: {
        CompositeTypes: {},
        Enums: {},
        Functions: {},
        Tables: {},
        Views: {}
      }
    },
    supabaseAnonKey,
    supabaseUrl
  };
}
