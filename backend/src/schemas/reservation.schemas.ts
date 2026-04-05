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

const reservationClasseCreateInReservationSchema = z.object({
  idClasseTarifaire: z.number().int().positive(),
  nbTables: z.number().int().positive('Le nombre de tables doit être positif'),
});

export const createReservationSchema = z.object({
  idEditeur: z.number().int().positive(),
  idFestival: z.number().int().positive(),
  notesResa: z.string().optional(),
  nbTablesResa: z.number().int().positive('Le nombre de tables doit être positif'),
  statut: statutWorkflowEnum.default('PAS_DE_CONTACT'),
  reservationClasses: z.array(reservationClasseCreateInReservationSchema).optional(),
}).superRefine((data, ctx) => {
  if (!data.reservationClasses || data.reservationClasses.length === 0) {
    return;
  }

  const seenClasseIds = new Set<number>();
  let totalTablesByClasse = 0;

  data.reservationClasses.forEach((reservationClasse, index) => {
    if (seenClasseIds.has(reservationClasse.idClasseTarifaire)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Une classe tarifaire ne peut être sélectionnée qu\'une seule fois',
        path: ['reservationClasses', index, 'idClasseTarifaire'],
      });
      return;
    }

    seenClasseIds.add(reservationClasse.idClasseTarifaire);
    totalTablesByClasse += reservationClasse.nbTables;
  });

  if (totalTablesByClasse > data.nbTablesResa) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La somme des tables par classe ne peut pas dépasser nbTablesResa',
      path: ['reservationClasses'],
    });
  }
});

export const updateReservationSchema = z.object({
  idEditeur: z.number().int().positive().optional(),
  idFestival: z.number().int().positive().optional(),
  notesResa: z.string().optional(),
  nbTablesResa: z.number().int().positive('Le nombre de tables doit être positif').optional(),
  statut: statutWorkflowEnum.optional(),
});

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
