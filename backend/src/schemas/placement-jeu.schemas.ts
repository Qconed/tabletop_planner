import { z } from 'zod';

// ========================================
// Schémas pour PlacementJeu
// ========================================

export const createPlacementJeuSchema = z.object({
  idReservation: z.number().int().positive(),
  idClasseTarifaire: z.number().int().positive(),
  idJeu: z.number().int().positive(),
  nbTables: z.number().int().positive('Le nombre de tables doit être positif'),
  quantiteJeu: z.number().int().positive('La quantité doit être positive'),
});

export const updatePlacementJeuSchema = z.object({
  idClasseTarifaire: z.number().int().positive().optional(),
  nbTables: z.number().int().positive().optional(),
  quantiteJeu: z.number().int().positive().optional(),
});

export const placementJeuIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const placementJeuQuerySchema = z.object({
  idReservation: z.string().regex(/^\d+$/).transform(Number).optional(),
  idClasseTarifaire: z.string().regex(/^\d+$/).transform(Number).optional(),
}).optional();

export type CreatePlacementJeuInput = z.infer<typeof createPlacementJeuSchema>;
export type UpdatePlacementJeuInput = z.infer<typeof updatePlacementJeuSchema>;
export type PlacementJeuIdInput = z.infer<typeof placementJeuIdSchema>;
export type PlacementJeuQueryInput = z.infer<typeof placementJeuQuerySchema>;
