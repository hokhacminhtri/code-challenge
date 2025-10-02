import { z } from 'zod';

// Base schema (no transforms so .partial() remains available)
const baseBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  description: z.string().optional(),
  publishedAt: z.union([z.string().datetime(), z.date()]).optional(),
  pages: z.number().int().positive().optional(),
  isbn: z.string().min(5).optional()
});

export const createBookSchema = baseBookSchema;
export const updateBookSchema = baseBookSchema.partial();

export function normalizeBookInput<T extends { publishedAt?: string | Date | undefined }>(d: T) {
  return {
    ...d,
    publishedAt: d.publishedAt ? new Date(d.publishedAt) : undefined
  } as Omit<T, 'publishedAt'> & { publishedAt?: Date };
}

export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  title: z.string().optional(),
  author: z.string().optional()
});

export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;
