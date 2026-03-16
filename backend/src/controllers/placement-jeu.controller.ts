import type { FastifyRequest, FastifyReply } from 'fastify';
import { placementJeuService } from '../services/placement-jeu.service.js';
import {
  createPlacementJeuSchema,
  updatePlacementJeuSchema,
  placementJeuIdSchema,
  placementJeuQuerySchema,
  type CreatePlacementJeuInput,
  type UpdatePlacementJeuInput,
} from '../schemas/placement-jeu.schemas.js';

export const placementJeuController = {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = placementJeuQuerySchema.parse(request.query);
      const placementsJeux = await placementJeuService.getAll(query);
      return reply.code(200).send(placementsJeux);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres de requête invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération des placements de jeux', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = placementJeuIdSchema.parse(request.params);
      const placementJeu = await placementJeuService.getById(id);

      if (!placementJeu) {
        return reply.code(404).send({ error: 'Placement de jeu non trouvé' });
      }

      return reply.code(200).send(placementJeu);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération du placement de jeu', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createPlacementJeuSchema.parse(request.body) as CreatePlacementJeuInput;
      const placementJeu = await placementJeuService.create(data);

      return reply.code(201).send(placementJeu);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2003') {
        return reply.code(400).send({ error: 'Réservation, classe tarifaire ou jeu invalide' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création du placement de jeu', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = placementJeuIdSchema.parse(request.params);
      const data = updatePlacementJeuSchema.parse(request.body) as UpdatePlacementJeuInput;

      const placementJeu = await placementJeuService.update(id, data);
      return reply.code(200).send(placementJeu);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Placement de jeu non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour du placement de jeu', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = placementJeuIdSchema.parse(request.params);
      await placementJeuService.delete(id);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Placement de jeu non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression du placement de jeu', details: error.message });
    }
  },
};
