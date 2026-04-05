import { PrismaClient } from '@prisma/client';
import type { CreateReservationClasseInput, UpdateReservationClasseInput, ReservationClasseQueryInput } from '../schemas/reservation-classe.schemas.js';

const prisma = new PrismaClient();

export const reservationClasseService = {
  async getAll(query?: ReservationClasseQueryInput) {
    const where: any = {};

    if (query?.idReservation) {
      where.idReservation = query.idReservation;
    }

    if (query?.idClasseTarifaire) {
      where.idClasseTarifaire = query.idClasseTarifaire;
    }

    return prisma.reservationClasse.findMany({
      where,
      include: {
        reservation: {
          include: {
            editeur: {
              select: {
                libelle: true,
              },
            },
          },
        },
        classeTarifaire: true,
      },
    });
  },

  async getById(id: number) {
    return prisma.reservationClasse.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            editeur: true,
            festival: true,
          },
        },
        classeTarifaire: true,
      },
    });
  },

  async create(data: CreateReservationClasseInput) {
    return prisma.reservationClasse.create({
      data,
      include: {
        reservation: true,
        classeTarifaire: true,
      },
    });
  },

  async update(id: number, data: UpdateReservationClasseInput) {
    return prisma.reservationClasse.update({
      where: { id },
      data,
      include: {
        reservation: true,
        classeTarifaire: true,
      },
    });
  },

  async delete(id: number) {
    return prisma.$transaction(async (tx) => {
      // Find the class assignment before deleting to get IDs
      const rc = await tx.reservationClasse.findUnique({
        where: { id },
        select: { idReservation: true, idClasseTarifaire: true },
      });

      if (rc) {
        // Automatically unplace games that were in this class for this reservation
        await tx.placementJeu.deleteMany({
          where: {
            idReservation: rc.idReservation,
            idClasseTarifaire: rc.idClasseTarifaire,
          },
        });
      }

      return tx.reservationClasse.delete({
        where: { id },
      });
    });
  },
};
