import { z } from 'zod';

// ========================================
// Schémas pour Festival
// ========================================

const createFestivalClasseTarifaireSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis').max(255),
  prixTable: z.number().int().nonnegative('Le prix doit être positif ou nul'),
  nbTotalTables: z.number().int().positive('Le nombre de tables doit être positif'),
});

export const createFestivalSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255),
  nbTotalTables: z.number().int().positive('Le nombre de tables doit être positif'),
  date: z.string().datetime().or(z.date()),
  classesTarifaires: z.array(createFestivalClasseTarifaireSchema)
    .min(1, 'Au moins une classe tarifaire est requise')
    .refine(
      (classesTarifaires) => {
        const libelles = classesTarifaires.map((classeTarifaire) => classeTarifaire.libelle.trim().toLowerCase());
        return new Set(libelles).size === libelles.length;
      },
      'Les noms des classes tarifaires doivent être uniques'
    ),
});

export const updateFestivalSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255).optional(),
  nbTotalTables: z.number().int().positive('Le nombre de tables doit être positif').optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export const festivalIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateFestivalInput = z.infer<typeof createFestivalSchema>;
export type UpdateFestivalInput = z.infer<typeof updateFestivalSchema>;
export type FestivalIdInput = z.infer<typeof festivalIdSchema>;
