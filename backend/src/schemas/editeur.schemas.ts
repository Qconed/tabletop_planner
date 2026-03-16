import { z } from 'zod';

// ========================================
// Schémas pour Editeur (GET only)
// ========================================

export const editeurIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const editeurQuerySchema = z.object({
  exposeJeux: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().optional(),
}).optional();

export type EditeurIdInput = z.infer<typeof editeurIdSchema>;
export type EditeurQueryInput = z.infer<typeof editeurQuerySchema>;
