import { z } from "zod";

export const searchUsersSchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(100),
  excludeProjectId: z.string().optional(),
  limit: z.coerce.number().min(1).max(25).default(10),
});

export type SearchUsersQuery = z.infer<typeof searchUsersSchema>;
