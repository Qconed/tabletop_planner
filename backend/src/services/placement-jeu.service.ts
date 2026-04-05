import { PrismaClient } from '@prisma/client';
import type { CreatePlacementJeuInput, UpdatePlacementJeuInput, PlacementJeuQueryInput } from '../schemas/placement-jeu.schemas.js';

const prisma = new PrismaClient();

export const placementJeuService = {
  async getAll(query?: PlacementJeuQueryInput) {
    const where: any = {};

    if (query?.idReservation) {
      where.idReservation = query.idReservation;
    }

    if (query?.idClasseTarifaire) {
      where.idClasseTarifaire = query.idClasseTarifaire;
    }

    return prisma.placementJeu.findMany({
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
        classeTarifaire: {
          select: {
            libelle: true,
            prixTable: true,
          },
        },
        jeuReservation: {
          include: {
            jeu: {
              select: {
                libelle: true,
                imageJeu: true,
              },
            },
          },
        },
      },
    });
  },

  async getById(id: number) {
    return prisma.placementJeu.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            editeur: true,
            festival: true,
          },
        },
        classeTarifaire: true,
        jeuReservation: {
          include: {
            jeu: true,
          },
        },
      },
    });
  },

  async create(data: CreatePlacementJeuInput) {
    // S'assurer que la liaison Jeu-Reservation existe
    await prisma.jeuReservation.upsert({
      where: {
        idReservation_idJeu: {
          idReservation: data.idReservation,
          idJeu: data.idJeu,
        },
      },
      update: {}, // Ne rien changer si ça existe déjà
      create: {
        idReservation: data.idReservation,
        idJeu: data.idJeu,
        quantite: data.quantiteJeu,
      },
    });

    // Générer l'idJeuReservation composite
    const idJeuReservation = `${data.idReservation}-${data.idJeu}`;

    return prisma.placementJeu.create({
      data: {
        ...data,
        idJeuReservation,
      },
      include: {
        reservation: true,
        classeTarifaire: true,
        jeuReservation: {
          include: {
            jeu: true,
          },
        },
      },
    });
  },

  async update(id: number, data: UpdatePlacementJeuInput) {
    return prisma.placementJeu.update({
      where: { id },
      data: {
        ...(data.idClasseTarifaire !== undefined && { idClasseTarifaire: data.idClasseTarifaire }),
        ...(data.nbTables !== undefined && { nbTables: data.nbTables }),
        ...(data.quantiteJeu !== undefined && { quantiteJeu: data.quantiteJeu }),
      },
      include: {
        reservation: true,
        classeTarifaire: true,
        jeuReservation: {
          include: {
            jeu: true,
          },
        },
      },
    });
  },

  async delete(id: number) {
    return prisma.placementJeu.delete({
      where: { id },
    });
  },
};
