import type { FastifyInstance } from 'fastify';
import { reservationClasseController } from '../controllers/reservation-classe.controller.js';

export default async function reservationClasseRoutes(fastify: FastifyInstance) {
  // GET /api/reservations-classes - Récupère toutes les réservations de classes (avec filtres optionnels)
  fastify.get('/', reservationClasseController.getAll);

  // GET /api/reservations-classes/:id - Récupère une réservation de classe par ID
  fastify.get('/:id', reservationClasseController.getById);

  // POST /api/reservations-classes - Crée une nouvelle réservation de classe
  fastify.post('/', { preHandler: fastify.authenticate }, reservationClasseController.create);

  // PUT /api/reservations-classes/:id - Met à jour une réservation de classe
  fastify.put('/:id', { preHandler: fastify.authenticate }, reservationClasseController.update);

  // DELETE /api/reservations-classes/:id - Supprime une réservation de classe
  fastify.delete('/:id', { preHandler: fastify.authenticate }, reservationClasseController.delete);
}
