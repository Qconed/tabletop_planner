import { z } from 'zod';

// ========================================
// Schémas pour Reservation
// ========================================

export const statutWorkflowEnum = z.enum([
  'PAS_DE_CONTACT',
  'CONTACT_PRIS',
  'DISCUSSION_EN_COURS',
  'SERA_ABSENT',
  'CONSIDERE_ABSENT',
  'PRESENT',
  'FACTURE',
  'FACTURE_PAYEE',
]);

export const createReservationSchema = z.object({
  idEditeur: z.number().int().positive(),
  idFestival: z.number().int().positive(),
  notesResa: z.string().optional(),
  viendraPresenter: z.boolean().default(false),
  nbTablesResa: z.number().int().positive('Le nombre de tables doit être positif'),
  statut: statutWorkflowEnum.default('PAS_DE_CONTACT'),
});

export const updateReservationSchema = createReservationSchema.partial();

export const reservationIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const reservationQuerySchema = z.object({
  idEditeur: z.string().regex(/^\d+$/).transform(Number).optional(),
  idFestival: z.string().regex(/^\d+$/).transform(Number).optional(),
  statut: statutWorkflowEnum.optional(),
}).optional();

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ReservationIdInput = z.infer<typeof reservationIdSchema>;
export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;
export type StatutWorkflow = z.infer<typeof statutWorkflowEnum>;
