import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// 404 handler
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
};

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Validation error', issues: err.issues });
    return;
  }
  if (err.code === 'P2025') { // Prisma record not found
    res.status(404).json({ message: 'Resource not found' });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Internal Server Error' });
};
