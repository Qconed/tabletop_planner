import type { FastifyInstance } from 'fastify';
import { placementJeuController } from '../controllers/placement-jeu.controller.js';

export default async function placementJeuRoutes(fastify: FastifyInstance) {
  // GET /api/placements-jeux - Récupère tous les placements de jeux (avec filtres optionnels)
  fastify.get('/', placementJeuController.getAll);

  // GET /api/placements-jeux/:id - Récupère un placement de jeu par ID
  fastify.get('/:id', placementJeuController.getById);

  // POST /api/placements-jeux - Crée un nouveau placement de jeu
  fastify.post('/', placementJeuController.create);

  // PUT /api/placements-jeux/:id - Met à jour un placement de jeu
  fastify.put('/:id', placementJeuController.update);

  // DELETE /api/placements-jeux/:id - Supprime un placement de jeu
  fastify.delete('/:id', placementJeuController.delete);
}
