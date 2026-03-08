import { PrismaClient } from '@prisma/client';
import type { CreateClasseTarifaireInput, UpdateClasseTarifaireInput, ClasseTarifaireQueryInput } from '../schemas/classe-tarifaire.schemas.js';

const prisma = new PrismaClient();

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
    return prisma.classeTarifaire.update({
      where: { id },
      data,
      include: {
        festival: true,
      },
    });
  },

  async delete(id: number) {
    return prisma.classeTarifaire.delete({
      where: { id },
    });
  },
};
