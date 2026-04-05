import { PrismaClient } from '@prisma/client';
import type { CreateClasseTarifaireInput, UpdateClasseTarifaireInput, ClasseTarifaireQueryInput } from '../schemas/classe-tarifaire.schemas.js';
import { recomputeFestivalTotalTables } from './festival.service.js';

const prisma = new PrismaClient();

const LAST_CLASSE_TARIFAIRE_DELETE_ERROR = 'LAST_CLASSE_TARIFAIRE_DELETE_ERROR';

function createLastClasseTarifaireDeleteError(): Error & { code: string } {
  const error = new Error('Un festival doit conserver au moins une classe tarifaire.') as Error & { code: string };
  error.code = LAST_CLASSE_TARIFAIRE_DELETE_ERROR;
  return error;
}

export const classeTarifaireService = {
  async getAll(query?: ClasseTarifaireQueryInput) {
    const where: any = {};

    if (query?.idFestival) {
      where.idFestival = query.idFestival;
    }

    return prisma.classeTarifaire.findMany({
      where,
      orderBy: { prixTable: 'asc' },
      include: {
        festival: {
          select: {
            id: true,
            nom: true,
          },
        },
        _count: {
          select: {
            reservationClasses: true,
            placementsJeux: true,
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.classeTarifaire.findUnique({
      where: { id },
      include: {
        festival: true,
        reservationClasses: {
          include: {
            reservation: {
              include: {
                editeur: true,
              },
            },
          },
        },
        placementsJeux: {
          include: {
            jeuReservation: {
              include: {
                jeu: true,
              },
            },
          },
        },
      },
    });
  },

  async create(data: CreateClasseTarifaireInput) {
    return prisma.$transaction(async (tx: any) => {
      const result = await tx.classeTarifaire.create({
        data,
        include: {
          festival: true,
        },
      });
      await recomputeFestivalTotalTables(tx, data.idFestival);
      return result;
    });
  },

  async update(id: number, data: UpdateClasseTarifaireInput) {
    return prisma.$transaction(async (tx: any) => {
      const updateData = {
        ...(data.libelle !== undefined && { libelle: data.libelle }),
        ...(data.prixTable !== undefined && { prixTable: data.prixTable }),
        ...(data.nbTotalTables !== undefined && { nbTotalTables: data.nbTotalTables }),
      };

      const result = await tx.classeTarifaire.update({
        where: { id },
        data: updateData,
        include: {
          festival: true,
        },
      });
      await recomputeFestivalTotalTables(tx, result.idFestival);
      return result;
    });
  },

  async delete(id: number) {
    return prisma.$transaction(async (tx: any) => {
      const classeTarifaire = await tx.classeTarifaire.findUnique({
        where: { id },
        select: {
          idFestival: true,
        },
      });

      if (!classeTarifaire) {
        return tx.classeTarifaire.delete({
          where: { id },
        });
      }

      const classesTarifairesCount = await tx.classeTarifaire.count({
        where: {
          idFestival: classeTarifaire.idFestival,
        },
      });

      if (classesTarifairesCount <= 1) {
        throw createLastClasseTarifaireDeleteError();
      }

      const result = await tx.classeTarifaire.delete({
        where: { id },
      });
      await recomputeFestivalTotalTables(tx, classeTarifaire.idFestival);
      return result;
    });
  },
};

export { LAST_CLASSE_TARIFAIRE_DELETE_ERROR };
