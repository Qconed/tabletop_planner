import type { FastifyInstance } from 'fastify';
import { classeTarifaireController } from '../controllers/classe-tarifaire.controller.js';

export default async function classeTarifaireRoutes(fastify: FastifyInstance) {
  // GET /api/classes-tarifaires - Récupère toutes les classes tarifaires (avec filtre optionnel par idFestival)
  fastify.get('/', classeTarifaireController.getAll);

  // GET /api/classes-tarifaires/:id - Récupère une classe tarifaire par ID
  fastify.get('/:id', classeTarifaireController.getById);

  // POST /api/classes-tarifaires - Crée une nouvelle classe tarifaire
  fastify.post('/', { preHandler: fastify.authenticate }, classeTarifaireController.create);

  // PUT /api/classes-tarifaires/:id - Met à jour une classe tarifaire
  fastify.put('/:id', { preHandler: fastify.authenticate }, classeTarifaireController.update);

  // DELETE /api/classes-tarifaires/:id - Supprime une classe tarifaire
  fastify.delete('/:id', { preHandler: fastify.authenticate }, classeTarifaireController.delete);
}
