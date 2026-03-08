import type { FastifyInstance } from 'fastify';
import { festivalController } from '../controllers/festival.controller.js';

export default async function festivalRoutes(fastify: FastifyInstance) {
  // GET /api/festivals - Récupère tous les festivals
  fastify.get('/', festivalController.getAll);

  // GET /api/festivals/:id - Récupère un festival par ID
  fastify.get('/:id', festivalController.getById);

  // POST /api/festivals - Crée un nouveau festival
  fastify.post('/', festivalController.create);

  // PUT /api/festivals/:id - Met à jour un festival
  fastify.put('/:id', festivalController.update);

  // DELETE /api/festivals/:id - Supprime un festival
  fastify.delete('/:id', festivalController.delete);
}
