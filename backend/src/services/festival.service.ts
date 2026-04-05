import { PrismaClient } from '@prisma/client';
import type { CreateFestivalInput, UpdateFestivalInput } from '../schemas/festival.schemas.js';

const prisma = new PrismaClient();

export const festivalService = {
  async getAll() {
    return prisma.festival.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            classesTarifaires: true,
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.festival.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            editeur: true,
          },
        },
        classesTarifaires: true,
        _count: {
          select: {
            reservations: true,
            classesTarifaires: true,
          },
        },
      },
    });
  },

  async create(data: CreateFestivalInput) {
    const totalTables = data.classesTarifaires.reduce((sum, classe) => sum + classe.nbTotalTables, 0);
    
    return prisma.$transaction(async (tx) => {
      return tx.festival.create({
        data: {
          nom: data.nom,
          nbTotalTables: totalTables,
          date: new Date(data.date),
          classesTarifaires: {
            create: data.classesTarifaires.map((classeTarifaire) => ({
              libelle: classeTarifaire.libelle,
              prixTable: classeTarifaire.prixTable,
              nbTotalTables: classeTarifaire.nbTotalTables,
            })),
          },
        },
        include: {
          classesTarifaires: true,
          _count: {
            select: {
              classesTarifaires: true,
            },
          },
        },
      });
    });
  },

  async update(id: number, data: UpdateFestivalInput) {
    return prisma.festival.update({
      where: { id },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
      },
    });
  },

  async delete(id: number) {
    return prisma.festival.delete({
      where: { id },
    });
  },
};

export async function recomputeFestivalTotalTables(tx: any, festivalId: number) {
  const result = await tx.classeTarifaire.aggregate({
    where: { idFestival: festivalId },
    _sum: { nbTotalTables: true }
  });
  const total = result._sum.nbTotalTables || 0;
  await tx.festival.update({
    where: { id: festivalId },
    data: { nbTotalTables: total }
  });
}
