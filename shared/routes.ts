import { z } from 'zod';
import { 
  insertMessageSchema, 
  projects, 
  skills, 
  experiences, 
  educations,
  testimonies
} from './schema';

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
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
  },
  skills: {
    list: {
      method: 'GET' as const,
      path: '/api/skills' as const,
      responses: {
        200: z.array(z.custom<typeof skills.$inferSelect>()),
      },
    },
  },
  experiences: {
    list: {
      method: 'GET' as const,
      path: '/api/experiences' as const,
      responses: {
        200: z.array(z.custom<typeof experiences.$inferSelect>()),
      },
    },
  },
  educations: {
    list: {
      method: 'GET' as const,
      path: '/api/educations' as const,
      responses: {
        200: z.array(z.custom<typeof educations.$inferSelect>()),
      },
    },
  },
  testimonies: {
    list: {
      method: 'GET' as const,
      path: '/api/testimonies' as const,
      responses: {
        200: z.array(z.custom<typeof testimonies.$inferSelect>()),
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

// Helper for frontend URL building
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
