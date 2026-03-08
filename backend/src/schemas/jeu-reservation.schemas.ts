import { z } from 'zod';

// ========================================
// Schémas pour JeuReservation
// ========================================

export const createJeuReservationSchema = z.object({
  idReservation: z.number().int().positive(),
  idJeu: z.number().int().positive(),
  quantite: z.number().int().positive().default(1),
});

export const updateJeuReservationSchema = z.object({
  quantite: z.number().int().positive(),
});

export const jeuReservationIdSchema = z.object({
  idReservation: z.string().regex(/^\d+$/).transform(Number),
  idJeu: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateJeuReservationInput = z.infer<typeof createJeuReservationSchema>;
export type UpdateJeuReservationInput = z.infer<typeof updateJeuReservationSchema>;
export type JeuReservationIdInput = z.infer<typeof jeuReservationIdSchema>;
