import { PrismaClient } from '@prisma/client';
import type { CreateJeuReservationInput, UpdateJeuReservationInput } from '../schemas/jeu-reservation.schemas.js';

const prisma = new PrismaClient();

export const jeuReservationService = {
  async getAll(idReservation?: number) {
    const where = idReservation ? { idReservation } : {};

    return prisma.jeuReservation.findMany({
      where,
      include: {
        jeu: {
          select: {
            id: true,
            libelle: true,
            imageJeu: true,
            editeur: {
              select: {
                libelle: true,
              },
            },
          },
        },
        reservation: {
          select: {
            id: true,
            festival: {
              select: {
                nom: true,
              },
            },
          },
        },
      },
    });
  },

  async getById(idReservation: number, idJeu: number) {
    return prisma.jeuReservation.findUnique({
      where: {
        idReservation_idJeu: {
          idReservation,
          idJeu,
        },
      },
      include: {
        jeu: true,
        reservation: {
          include: {
            festival: true,
            editeur: true,
          },
        },
      },
    });
  },

  async create(data: CreateJeuReservationInput) {
    return prisma.jeuReservation.create({
      data,
      include: {
        jeu: true,
        reservation: true,
      },
    });
  },

  async update(idReservation: number, idJeu: number, data: UpdateJeuReservationInput) {
    return prisma.jeuReservation.update({
      where: {
        idReservation_idJeu: {
          idReservation,
          idJeu,
        },
      },
      data,
      include: {
        jeu: true,
        reservation: true,
      },
    });
  },

  async delete(idReservation: number, idJeu: number) {
    return prisma.jeuReservation.delete({
      where: {
        idReservation_idJeu: {
          idReservation,
          idJeu,
        },
      },
    });
  },
};
