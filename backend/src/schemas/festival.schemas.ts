import { z } from 'zod';

// ========================================
// Schémas pour Festival
// ========================================

export const createFestivalSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255),
  nbTotalTables: z.number().int().positive('Le nombre de tables doit être positif'),
  date: z.string().datetime().or(z.date()),
});

export const updateFestivalSchema = createFestivalSchema.partial();

export const festivalIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateFestivalInput = z.infer<typeof createFestivalSchema>;
export type UpdateFestivalInput = z.infer<typeof updateFestivalSchema>;
export type FestivalIdInput = z.infer<typeof festivalIdSchema>;
