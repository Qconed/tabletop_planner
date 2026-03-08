import type { FastifyRequest, FastifyReply } from 'fastify';
import { reservationService } from '../services/reservation.service.js';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationIdSchema,
  reservationQuerySchema,
  type CreateReservationInput,
  type UpdateReservationInput,
} from '../schemas/reservation.schemas.js';

export const reservationController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = reservationQuerySchema.parse(request.query);
      const reservations = await reservationService.getAll(query);
      return reply.code(200).send(reservations);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des réservations', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationIdSchema.parse(request.params);
      const reservation = await reservationService.getById(id);

      if (!reservation) {
        return reply.code(404).send({ error: 'Réservation non trouvée' });
      }

      return reply.code(200).send(reservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération de la réservation', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createReservationSchema.parse(request.body) as CreateReservationInput;
      const reservation = await reservationService.create(data);

      return reply.code(201).send(reservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2003') {
        return reply.code(400).send({ error: 'Éditeur ou festival invalide' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création de la réservation', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationIdSchema.parse(request.params);
      const data = updateReservationSchema.parse(request.body) as UpdateReservationInput;

      const reservation = await reservationService.update(id, data);
      return reply.code(200).send(reservation);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Réservation non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour de la réservation', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = reservationIdSchema.parse(request.params);
      await reservationService.delete(id);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Réservation non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression de la réservation', details: error.message });
    }
  },

  // Endpoint pour récupérer les statuts disponibles
  async getStatuts(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const statuts = reservationService.getStatuts();
      return reply.code(200).send(statuts);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erreur lors de la récupération des statuts', details: error.message });
    }
  },
};
