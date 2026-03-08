import type { FastifyRequest, FastifyReply } from 'fastify';
import { reservationClasseService } from '../services/reservation-classe.service.js';
import {
  createReservationClasseSchema,
  updateReservationClasseSchema,
  reservationClasseIdSchema,
  reservationClasseQuerySchema,
  type CreateReservationClasseInput,
  type UpdateReservationClasseInput,
} from '../schemas/reservation-classe.schemas.js';

export const reservationClasseController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = reservationClasseQuerySchema.parse(request.query);
      const reservationClasses = await reservationClasseService.getAll(query);
      return reply.code(200).send(reservationClasses);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des réservations de classes', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationClasseIdSchema.parse(request.params);
      const reservationClasse = await reservationClasseService.getById(id);

      if (!reservationClasse) {
        return reply.code(404).send({ error: 'Réservation de classe non trouvée' });
      }

      return reply.code(200).send(reservationClasse);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération de la réservation de classe', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createReservationClasseSchema.parse(request.body) as CreateReservationClasseInput;
      const reservationClasse = await reservationClasseService.create(data);

      return reply.code(201).send(reservationClasse);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2003') {
        return reply.code(400).send({ error: 'Réservation ou classe tarifaire invalide' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création de la réservation de classe', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationClasseIdSchema.parse(request.params);
      const data = updateReservationClasseSchema.parse(request.body) as UpdateReservationClasseInput;

      const reservationClasse = await reservationClasseService.update(id, data);
      return reply.code(200).send(reservationClasse);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Réservation de classe non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour de la réservation de classe', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationClasseIdSchema.parse(request.params);
      await reservationClasseService.delete(id);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Réservation de classe non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression de la réservation de classe', details: error.message });
    }
  },
};
