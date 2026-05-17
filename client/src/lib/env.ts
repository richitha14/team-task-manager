const apiUrl = import.meta.env.VITE_API_URL ?? "";

/** Base URL for API calls. Empty string uses Vite dev proxy (`/api`). */
export const env = {
  apiUrl,
} as const;
