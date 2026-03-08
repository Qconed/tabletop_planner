import type { FastifyInstance } from 'fastify';
import { reservationController } from '../controllers/reservation.controller.js';

export default async function reservationRoutes(fastify: FastifyInstance) {
  // GET /api/reservations/statuts - Récupère les statuts disponibles
  fastify.get('/statuts', reservationController.getStatuts);

  // GET /api/reservations - Récupère toutes les réservations (avec filtres optionnels)
  fastify.get('/', reservationController.getAll);

  // GET /api/reservations/:id - Récupère une réservation par ID
  fastify.get('/:id', reservationController.getById);

  // POST /api/reservations - Crée une nouvelle réservation
  fastify.post('/', reservationController.create);

  // PUT /api/reservations/:id - Met à jour une réservation
  fastify.put('/:id', reservationController.update);

  // DELETE /api/reservations/:id - Supprime une réservation
  fastify.delete('/:id', reservationController.delete);
}
