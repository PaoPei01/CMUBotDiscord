import type { WorkerEnv } from "../env.js";

export type SupabaseFetchClient = {
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

export function createSupabaseClient(env: WorkerEnv): SupabaseFetchClient {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/u, "");
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    async request<T>(path: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers);
      headers.set("apikey", serviceRoleKey);
      headers.set("Authorization", `Bearer ${serviceRoleKey}`);
      headers.set("Content-Type", "application/json");

      const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
        ...init,
        headers
      });

      if (!response.ok) {
        throw new Error(`Supabase request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();

      if (!text.trim()) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    }
  };
}
