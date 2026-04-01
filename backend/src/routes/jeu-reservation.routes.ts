import type { FastifyInstance } from 'fastify';
import { jeuReservationController } from '../controllers/jeu-reservation.controller.js';

export default async function jeuReservationRoutes(fastify: FastifyInstance) {
  // GET /api/jeux-reservations - Récupère tous les jeux réservés (avec filtre optionnel par idReservation)
  fastify.get('/', jeuReservationController.getAll);

  // GET /api/jeux-reservations/:idReservation/:idJeu - Récupère un jeu réservé spécifique
  fastify.get('/:idReservation/:idJeu', jeuReservationController.getById);

  // POST /api/jeux-reservations - Crée une nouvelle réservation de jeu
  fastify.post('/', { preHandler: fastify.authenticate }, jeuReservationController.create);

  // PUT /api/jeux-reservations/:idReservation/:idJeu - Met à jour une réservation de jeu
  fastify.put('/:idReservation/:idJeu', { preHandler: fastify.authenticate }, jeuReservationController.update);

  // DELETE /api/jeux-reservations/:idReservation/:idJeu - Supprime une réservation de jeu
  fastify.delete('/:idReservation/:idJeu', { preHandler: fastify.authenticate }, jeuReservationController.delete);
}
