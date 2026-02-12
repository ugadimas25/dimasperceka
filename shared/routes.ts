import { z } from 'zod';
import { 
  insertMessageSchema,
  type InsertMessage,
  type Project,
  type Skill,
  type Experience,
  type Education,
  type Testimony,
} from './schema';

export type { InsertMessage };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects' as const,
      responses: {
        200: z.array(z.custom<Project>()),
      },
    },
  },
  skills: {
    list: {
      method: 'GET' as const,
      path: '/api/skills' as const,
      responses: {
        200: z.array(z.custom<Skill>()),
      },
    },
  },
  experiences: {
    list: {
      method: 'GET' as const,
      path: '/api/experiences' as const,
      responses: {
        200: z.array(z.custom<Experience>()),
      },
    },
  },
  educations: {
    list: {
      method: 'GET' as const,
      path: '/api/educations' as const,
      responses: {
        200: z.array(z.custom<Education>()),
      },
    },
  },
  testimonies: {
    list: {
      method: 'GET' as const,
      path: '/api/testimonies' as const,
      responses: {
        200: z.array(z.custom<Testimony>()),
      },
    },
  },
  contact: {
    submit: {
      method: 'POST' as const,
      path: '/api/contact' as const,
      input: insertMessageSchema,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
};
