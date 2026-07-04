// src/lib/errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'เกิดข้อผิดพลาด',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function badRequest(code: string, message: string, details?: any) {
  return new ApiError(400, code, message, details);
}

export function unauthorized(message = 'กรุณาเข้าสู่ระบบ') {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'ไม่มีสิทธิ์เข้าถึง') {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'ไม่พบข้อมูล') {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function conflict(code: string, message: string, details?: any) {
  return new ApiError(409, code, message, details);
}

export function unprocessable(code: string, message: string, details?: any) {
  return new ApiError(422, code, message, details);
}
