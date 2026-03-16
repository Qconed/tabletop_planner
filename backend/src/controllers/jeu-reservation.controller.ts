import type { FastifyRequest, FastifyReply } from 'fastify';
import { jeuReservationService } from '../services/jeu-reservation.service.js';
import {
  createJeuReservationSchema,
  updateJeuReservationSchema,
  jeuReservationIdSchema,
  type CreateJeuReservationInput,
  type UpdateJeuReservationInput,
} from '../schemas/jeu-reservation.schemas.js';

export const jeuReservationController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idReservation } = request.query as any;
      const id = idReservation ? parseInt(idReservation) : undefined;
      const jeuxReservations = await jeuReservationService.getAll(id);
      return reply.code(200).send(jeuxReservations);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erreur lors de la récupération des jeux réservés', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idReservation, idJeu } = jeuReservationIdSchema.parse(request.params);
      const jeuReservation = await jeuReservationService.getById(idReservation, idJeu);

      if (!jeuReservation) {
        return reply.code(404).send({ error: 'Jeu réservé non trouvé' });
      }

      return reply.code(200).send(jeuReservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération du jeu réservé', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createJeuReservationSchema.parse(request.body) as CreateJeuReservationInput;
      const jeuReservation = await jeuReservationService.create(data);

      return reply.code(201).send(jeuReservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Ce jeu est déjà réservé pour cette réservation' });
      }
      if (error.code === 'P2003') {
        return reply.code(400).send({ error: 'Réservation ou jeu invalide' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création du jeu réservé', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idReservation, idJeu } = jeuReservationIdSchema.parse(request.params);
      const data = updateJeuReservationSchema.parse(request.body) as UpdateJeuReservationInput;

      const jeuReservation = await jeuReservationService.update(idReservation, idJeu, data);
      return reply.code(200).send(jeuReservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Jeu réservé non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour du jeu réservé', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idReservation, idJeu } = jeuReservationIdSchema.parse(request.params);
      await jeuReservationService.delete(idReservation, idJeu);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Jeu réservé non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression du jeu réservé', details: error.message });
    }
  },
};
