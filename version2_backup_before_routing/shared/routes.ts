import { z } from 'zod';

export const api = {
  // We can add REST endpoints here if needed, but this app is primarily WebSocket based.
  health: {
    method: 'GET' as const,
    path: '/api/health',
    responses: {
      200: z.object({ status: z.string() }),
    },
  },
};

// Helper to build URLs (frontend requirement)
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
