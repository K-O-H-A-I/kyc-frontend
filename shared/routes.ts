import { z } from 'zod';
import { insertAnalysisResultSchema, analysisResults } from './schema';

export const api = {
  // These endpoints are mock placeholders for the frontend-only demo
  analysis: {
    create: {
      method: 'POST' as const,
      path: '/api/analysis',
      input: z.object({
        filename: z.string(),
        content: z.string().optional(),
        toolType: z.enum(['document', 'fact-check', 'propaganda', 'metadata', 'geo']),
      }),
      responses: {
        200: z.array(z.custom<typeof analysisResults.$inferSelect>()),
      },
    },
  },
};

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
