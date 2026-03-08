import { PrismaClient } from '@prisma/client';
import type { EditeurQueryInput } from '../schemas/editeur.schemas.js';

const prisma = new PrismaClient();

export const editeurService = {
  async getAll(query?: EditeurQueryInput) {
    const where: any = {};

    if (query?.exposeJeux !== undefined) {
      where.exposeJeux = query.exposeJeux;
    }

    if (query?.estDistributeur !== undefined) {
      where.estDistributeur = query.estDistributeur;
    }

    if (query?.search) {
      where.libelle = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    return prisma.editeur.findMany({
      where,
      orderBy: { libelle: 'asc' },
      include: {
        _count: {
          select: {
            jeux: true,
            reservations: true,
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.editeur.findUnique({
      where: { id },
      include: {
        jeux: {
          take: 50,
          orderBy: { libelle: 'asc' },
        },
        reservations: {
          include: {
            festival: true,
          },
        },
        _count: {
          select: {
            jeux: true,
            reservations: true,
          },
        },
      },
    });
  },
};
