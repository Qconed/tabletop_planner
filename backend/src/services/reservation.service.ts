import { PrismaClient } from '@prisma/client';
import type { CreateReservationInput, UpdateReservationInput, ReservationQueryInput } from '../schemas/reservation.schemas.js';

const prisma = new PrismaClient();

export const reservationService = {
  async getAll(query?: ReservationQueryInput) {
    const where: any = {};

    if (query?.idEditeur) {
      where.idEditeur = query.idEditeur;
    }

    if (query?.idFestival) {
      where.idFestival = query.idFestival;
    }

    if (query?.statut) {
      where.statut = query.statut;
    }

    return prisma.reservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        editeur: {
          select: {
            id: true,
            libelle: true,
            logoEditeur: true,
          },
        },
        festival: {
          select: {
            id: true,
            nom: true,
            date: true,
          },
        },
        _count: {
          select: {
            jeuxReservations: true,
            reservationClasses: true,
            placementsJeux: true,
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.reservation.findUnique({
      where: { id },
      include: {
        editeur: true,
        festival: true,
        jeuxReservations: {
          include: {
            jeu: {
              select: {
                id: true,
                libelle: true,
                imageJeu: true,
              },
            },
          },
        },
        reservationClasses: {
          include: {
            classeTarifaire: true,
          },
        },
        placementsJeux: {
          include: {
            classeTarifaire: true,
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

  async create(data: CreateReservationInput) {
    return prisma.reservation.create({
      data,
      include: {
        editeur: true,
        festival: true,
      },
    });
  },

  async update(id: number, data: UpdateReservationInput) {
    return prisma.reservation.update({
      where: { id },
      data,
      include: {
        editeur: true,
        festival: true,
      },
    });
  },

  async delete(id: number) {
    return prisma.reservation.delete({
      where: { id },
    });
  },

  // Méthode utilitaire pour obtenir les statuts disponibles
  getStatuts() {
    return [
      'PAS_DE_CONTACT',
      'CONTACT_PRIS',
      'DISCUSSION_EN_COURS',
      'SERA_ABSENT',
      'CONSIDERE_ABSENT',
      'PRESENT',
      'FACTURE',
      'FACTURE_PAYEE',
    ];
  },
};
