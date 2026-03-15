import type { FastifyRequest, FastifyReply } from 'fastify';
import { classeTarifaireService, LAST_CLASSE_TARIFAIRE_DELETE_ERROR } from '../services/classe-tarifaire.service.js';
import {
  createClasseTarifaireSchema,
  updateClasseTarifaireSchema,
  classeTarifaireIdSchema,
  classeTarifaireQuerySchema,
  type CreateClasseTarifaireInput,
  type UpdateClasseTarifaireInput,
} from '../schemas/classe-tarifaire.schemas.js';

export const classeTarifaireController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = classeTarifaireQuerySchema.parse(request.query);
      const classesTarifaires = await classeTarifaireService.getAll(query);
      return reply.code(200).send(classesTarifaires);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des classes tarifaires', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = classeTarifaireIdSchema.parse(request.params);
      const classeTarifaire = await classeTarifaireService.getById(id);

      if (!classeTarifaire) {
        return reply.code(404).send({ error: 'Classe tarifaire non trouvée' });
      }

      return reply.code(200).send(classeTarifaire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération de la classe tarifaire', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createClasseTarifaireSchema.parse(request.body) as CreateClasseTarifaireInput;
      const classeTarifaire = await classeTarifaireService.create(data);

      return reply.code(201).send(classeTarifaire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2003') {
        return reply.code(400).send({ error: 'Festival invalide' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création de la classe tarifaire', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = classeTarifaireIdSchema.parse(request.params);
      const data = updateClasseTarifaireSchema.parse(request.body) as UpdateClasseTarifaireInput;

      const classeTarifaire = await classeTarifaireService.update(id, data);
      return reply.code(200).send(classeTarifaire);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Classe tarifaire non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour de la classe tarifaire', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = classeTarifaireIdSchema.parse(request.params);
      await classeTarifaireService.delete(id);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === LAST_CLASSE_TARIFAIRE_DELETE_ERROR) {
        return reply.code(409).send({ error: error.message });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Classe tarifaire non trouvée' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression de la classe tarifaire', details: error.message });
    }
  },
};
