import type { FastifyRequest, FastifyReply } from 'fastify';
import { editeurService } from '../services/editeur.service.js';
import { editeurIdSchema, editeurQuerySchema } from '../schemas/editeur.schemas.js';

export const editeurController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = editeurQuerySchema.parse(request.query);
      const editeurs = await editeurService.getAll(query);
      return reply.code(200).send(editeurs);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des éditeurs', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = editeurIdSchema.parse(request.params);
      const editeur = await editeurService.getById(id);

      if (!editeur) {
        return reply.code(404).send({ error: 'Éditeur non trouvé' });
      }

      return reply.code(200).send(editeur);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération de l\'éditeur', details: error.message });
    }
  },
};
