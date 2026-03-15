import { z } from 'zod';

// ========================================
// Schémas pour ClasseTarifaire
// ========================================

export const createClasseTarifaireSchema = z.object({
  idFestival: z.number().int().positive(),
  libelle: z.string().min(1, 'Le libellé est requis').max(255),
  prixTable: z.number().int().nonnegative('Le prix doit être positif ou nul'),
  nbTotalTables: z.number().int().positive('Le nombre de tables doit être positif'),
});

export const updateClasseTarifaireSchema = createClasseTarifaireSchema.omit({ idFestival: true }).partial();

export const classeTarifaireIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const classeTarifaireQuerySchema = z.object({
  idFestival: z.string().regex(/^\d+$/).transform(Number).optional(),
}).optional();

export type CreateClasseTarifaireInput = z.infer<typeof createClasseTarifaireSchema>;
export type UpdateClasseTarifaireInput = z.infer<typeof updateClasseTarifaireSchema>;
export type ClasseTarifaireIdInput = z.infer<typeof classeTarifaireIdSchema>;
export type ClasseTarifaireQueryInput = z.infer<typeof classeTarifaireQuerySchema>;
