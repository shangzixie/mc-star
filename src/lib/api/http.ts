import { NextResponse } from 'next/server';
import { ZodError, type z } from 'zod';

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: ApiError | Error, fallbackStatus = 500) {
  if (error instanceof ApiError) {
    const payload: ApiErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return NextResponse.json(payload, { status: error.status });
  }

  const payload: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal Server Error',
    },
  };
  return NextResponse.json(payload, { status: fallbackStatus });
}

export async function parseJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const raw = await request.json().catch(() => {
    throw new ApiError({
      status: 400,
      code: 'INVALID_JSON',
      message: 'Invalid JSON body',
    });
  });

  try {
    return schema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiError({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      });
    }
    throw err;
  }
}


