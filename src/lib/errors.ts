import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non authentifié') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Ressource') {
    super(`${resource} non trouvé(e)`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
}

export function forbidden(message = 'Admin requis'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function errorResponse(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      },
      { status: error.statusCode }
    );
  }

  // Erreur inattendue - ne pas exposer les détails en prod
  return NextResponse.json(
    {
      error: 'Une erreur est survenue',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    },
    { status: 500 }
  );
}