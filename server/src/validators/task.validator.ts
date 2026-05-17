import { z } from "zod";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]);
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid due date")
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  status: taskStatusEnum.default("TODO"),
  priority: taskPriorityEnum.default("MEDIUM"),
  dueDate: dueDateSchema,
  assigneeId: z.string().min(1).optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .nullable(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    dueDate: dueDateSchema,
    assigneeId: z.string().min(1).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
});

export const listTasksQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assigneeId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
