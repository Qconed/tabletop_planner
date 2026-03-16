import type { FastifyRequest, FastifyReply } from 'fastify';
import { festivalService } from '../services/festival.service.js';
import {
  createFestivalSchema,
  updateFestivalSchema,
  festivalIdSchema,
  type CreateFestivalInput,
  type UpdateFestivalInput,
} from '../schemas/festival.schemas.js';

export const festivalController = {
  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const festivals = await festivalService.getAll();
      return reply.code(200).send(festivals);
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erreur lors de la récupération des festivals', details: error.message });
    }
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = festivalIdSchema.parse(request.params);
      const festival = await festivalService.getById(id);

      if (!festival) {
        return reply.code(404).send({ error: 'Festival non trouvé' });
      }

      return reply.code(200).send(festival);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la récupération du festival', details: error.message });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = createFestivalSchema.parse(request.body) as CreateFestivalInput;
      const festival = await festivalService.create(data);

      return reply.code(201).send(festival);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      return reply.code(500).send({ error: 'Erreur lors de la création du festival', details: error.message });
    }
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = festivalIdSchema.parse(request.params);
      const data = updateFestivalSchema.parse(request.body) as UpdateFestivalInput;

      const festival = await festivalService.update(id, data);
      return reply.code(200).send(festival);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Données invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Festival non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la mise à jour du festival', details: error.message });
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = festivalIdSchema.parse(request.params);
      await festivalService.delete(id);

      return reply.code(204).send();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Paramètres invalides', details: error.errors });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Festival non trouvé' });
      }
      return reply.code(500).send({ error: 'Erreur lors de la suppression du festival', details: error.message });
    }
  },
};
