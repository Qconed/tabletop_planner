import type { FastifyRequest, FastifyReply } from 'fastify';
import { jeuService } from '../services/jeu.service.js';
import { jeuIdSchema, jeuQuerySchema } from '../schemas/jeu.schemas.js';

export const jeuController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = jeuQuerySchema.parse(request.query);
      const jeux = await jeuService.getAll(query);
      return reply.code(200).send(jeux);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des jeux', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = jeuIdSchema.parse(request.params);
      const jeu = await jeuService.getById(id);

      if (!jeu) {
        return reply.code(404).send({ error: 'Jeu non trouvé' });
      }

      return reply.code(200).send(jeu);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération du jeu', details: error.message });
    }
  },
};
