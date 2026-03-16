import { PrismaClient } from '@prisma/client';
import type { CreateClasseTarifaireInput, UpdateClasseTarifaireInput, ClasseTarifaireQueryInput } from '../schemas/classe-tarifaire.schemas.js';

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
    return prisma.classeTarifaire.create({
      data,
      include: {
        festival: true,
      },
    });
  },

  async update(id: number, data: UpdateClasseTarifaireInput) {
    const updateData = {
      ...(data.libelle !== undefined && { libelle: data.libelle }),
      ...(data.prixTable !== undefined && { prixTable: data.prixTable }),
      ...(data.nbTotalTables !== undefined && { nbTotalTables: data.nbTotalTables }),
    };

    return prisma.classeTarifaire.update({
      where: { id },
      data: updateData,
      include: {
        festival: true,
      },
    });
  },

  async delete(id: number) {
    return prisma.$transaction(async (tx) => {
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

      return tx.classeTarifaire.delete({
        where: { id },
      });
    });
  },
};

export { LAST_CLASSE_TARIFAIRE_DELETE_ERROR };
