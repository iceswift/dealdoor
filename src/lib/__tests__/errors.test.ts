// src/lib/__tests__/errors.test.ts

import { describe, it, expect } from 'vitest';
import {
  ApiError,
  handleApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
} from '../errors';

describe('ApiError', () => {
  it('creates error with correct properties', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'name' });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'name' });
    expect(error.name).toBe('ApiError');
  });
});

describe('Error helpers', () => {
  it('badRequest creates 400 error', () => {
    const error = badRequest('TEST', 'Test message');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST');
  });

  it('unauthorized creates 401 error', () => {
    const error = unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('forbidden creates 403 error', () => {
    const error = forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('notFound creates 404 error', () => {
    const error = notFound();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('conflict creates 409 error', () => {
    const error = conflict('TEST', 'Test message');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('TEST');
  });

  it('unprocessable creates 422 error', () => {
    const error = unprocessable('TEST', 'Test message');
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('TEST');
  });
});

describe('handleApiError', () => {
  it('handles ApiError correctly', async () => {
    const error = badRequest('TEST', 'Test message');
    const response = handleApiError(error);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TEST');
    expect(body.error.message).toBe('Test message');
  });

  it('handles unknown errors', async () => {
    const error = new Error('Unknown error');
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
