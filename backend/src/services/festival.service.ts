import { PrismaClient } from '@prisma/client';
import type { CreateFestivalInput, UpdateFestivalInput } from '../schemas/festival.schemas.js';

const prisma = new PrismaClient();

export const festivalService = {
  async getAll() {
    return prisma.festival.findMany({
      orderBy: { date: 'desc' },
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
    return prisma.festival.create({
      data: {
        nom: data.nom,
        nbTotalTables: data.nbTotalTables,
        date: new Date(data.date),
      },
    });
  },

  async update(id: number, data: UpdateFestivalInput) {
    return prisma.festival.update({
      where: { id },
      data: {
        ...(data.nom && { nom: data.nom }),
        ...(data.nbTotalTables && { nbTotalTables: data.nbTotalTables }),
        ...(data.date && { date: new Date(data.date) }),
      },
    });
  },

  async delete(id: number) {
    return prisma.festival.delete({
      where: { id },
    });
  },
};
