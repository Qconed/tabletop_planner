import type { FastifyInstance } from 'fastify';
import { jeuController } from '../controllers/jeu.controller.js';

export default async function jeuRoutes(fastify: FastifyInstance) {
  // GET /api/jeux - Récupère tous les jeux (avec filtres optionnels)
  fastify.get('/', jeuController.getAll);

  // GET /api/jeux/:id - Récupère un jeu par ID
  fastify.get('/:id', jeuController.getById);
}
