import { z } from 'zod';

// ========================================
// Schémas pour ReservationClasse
// ========================================

export const createReservationClasseSchema = z.object({
  idClasseTarifaire: z.number().int().positive(),
  idReservation: z.number().int().positive(),
  nbTables: z.number().int().positive('Le nombre de tables doit être positif'),
});

export const updateReservationClasseSchema = z.object({
  nbTables: z.number().int().positive('Le nombre de tables doit être positif'),
});

export const reservationClasseIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const reservationClasseQuerySchema = z.object({
  idReservation: z.string().regex(/^\d+$/).transform(Number).optional(),
  idClasseTarifaire: z.string().regex(/^\d+$/).transform(Number).optional(),
}).optional();

export type CreateReservationClasseInput = z.infer<typeof createReservationClasseSchema>;
export type UpdateReservationClasseInput = z.infer<typeof updateReservationClasseSchema>;
export type ReservationClasseIdInput = z.infer<typeof reservationClasseIdSchema>;
export type ReservationClasseQueryInput = z.infer<typeof reservationClasseQuerySchema>;
