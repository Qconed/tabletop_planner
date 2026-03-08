import { PrismaClient } from '@prisma/client';
import type { JeuQueryInput } from '../schemas/jeu.schemas.js';

const prisma = new PrismaClient();

export const jeuService = {
  async getAll(query?: JeuQueryInput) {
    const where: any = {};

    if (query?.idEditeur) {
      where.idEditeur = query.idEditeur;
    }

    if (query?.search) {
      where.OR = [
        {
          libelle: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          auteur: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return prisma.jeu.findMany({
      where,
      orderBy: { libelle: 'asc' },
      include: {
        editeur: {
          select: {
            id: true,
            libelle: true,
            logoEditeur: true,
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.jeu.findUnique({
      where: { id },
      include: {
        editeur: true,
        jeuxReservations: {
          include: {
            reservation: {
              include: {
                festival: true,
              },
            },
          },
        },
      },
    });
  },
};
