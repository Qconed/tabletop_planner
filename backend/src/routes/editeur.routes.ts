import type { FastifyInstance } from 'fastify';
import { editeurController } from '../controllers/editeur.controller.js';

export default async function editeurRoutes(fastify: FastifyInstance) {
  // GET /api/editeurs - Récupère tous les éditeurs (avec filtres optionnels)
  fastify.get('/', editeurController.getAll);

  // GET /api/editeurs/:id - Récupère un éditeur par ID
  fastify.get('/:id', editeurController.getById);
}
