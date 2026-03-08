import { z } from 'zod';

// ========================================
// Schémas pour Jeu (GET only)
// ========================================

export const jeuIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const jeuQuerySchema = z.object({
  idEditeur: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
}).optional();

export type JeuIdInput = z.infer<typeof jeuIdSchema>;
export type JeuQueryInput = z.infer<typeof jeuQuerySchema>;
