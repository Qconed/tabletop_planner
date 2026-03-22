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
    return prisma.$transaction(async (tx) => {
      const {
        reservationClasses,
        idEditeur,
        idFestival,
        notesResa,
        nbTablesResa,
        statut,
      } = data;

      if (reservationClasses && reservationClasses.length > 0) {
        const classeTarifaireIds = reservationClasses.map((item) => item.idClasseTarifaire);

        const classesTarifaires = await tx.classeTarifaire.findMany({
          where: {
            id: { in: classeTarifaireIds },
          },
          select: {
            id: true,
            idFestival: true,
            nbTotalTables: true,
          },
        });

        if (classesTarifaires.length !== classeTarifaireIds.length) {
          const error = new Error('Une ou plusieurs classes tarifaires sont invalides.') as Error & { code: string };
          error.code = 'RESERVATION_INVALID_CLASSE_TARIFAIRE';
          throw error;
        }

        const classById = new Map(classesTarifaires.map((classeTarifaire) => [classeTarifaire.id, classeTarifaire]));

        for (const reservationClasse of reservationClasses) {
          const classeTarifaire = classById.get(reservationClasse.idClasseTarifaire);

          if (!classeTarifaire || classeTarifaire.idFestival !== idFestival) {
            const error = new Error('Chaque classe tarifaire doit appartenir au festival de la réservation.') as Error & { code: string };
            error.code = 'RESERVATION_FESTIVAL_MISMATCH';
            throw error;
          }

          if (reservationClasse.nbTables > classeTarifaire.nbTotalTables) {
            const error = new Error(`Le nombre de tables pour la classe ${classeTarifaire.id} dépasse sa capacité.`) as Error & { code: string };
            error.code = 'RESERVATION_CLASS_CAPACITY_EXCEEDED';
            throw error;
          }
        }
      }

      const createData = {
        idEditeur,
        idFestival,
        nbTablesResa,
        statut,
        ...(notesResa !== undefined && { notesResa }),
        ...(reservationClasses && reservationClasses.length > 0 && {
          reservationClasses: {
            create: reservationClasses.map((reservationClasse) => ({
              idClasseTarifaire: reservationClasse.idClasseTarifaire,
              nbTables: reservationClasse.nbTables,
            })),
          },
        }),
      };

      return tx.reservation.create({
        data: createData,
        include: {
          editeur: true,
          festival: true,
          reservationClasses: {
            include: {
              classeTarifaire: true,
            },
          },
        },
      });
    });
  },

  async update(id: number, data: UpdateReservationInput) {
    const updateData = {
      ...(data.idEditeur !== undefined && { idEditeur: data.idEditeur }),
      ...(data.idFestival !== undefined && { idFestival: data.idFestival }),
      ...(data.notesResa !== undefined && { notesResa: data.notesResa }),
      ...(data.nbTablesResa !== undefined && { nbTablesResa: data.nbTablesResa }),
      ...(data.statut !== undefined && { statut: data.statut }),
    };

    return prisma.reservation.update({
      where: { id },
      data: updateData,
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
