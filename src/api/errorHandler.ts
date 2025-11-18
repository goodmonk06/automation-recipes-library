import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { RecipeValidationError } from '../models/recipe';

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * エラーをAPIレスポンス形式に変換
 */
export function formatError(error: unknown): ApiError {
  if (error instanceof RecipeValidationError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'VALIDATION_ERROR',
        details: { field: error.field },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'INTERNAL_ERROR',
      },
    };
  }

  return {
    success: false,
    error: {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    },
  };
}

/**
 * 成功レスポンスを生成
 */
export function formatSuccess<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Express エラーハンドリングミドルウェア
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  const errorResponse = formatError(err);
  const statusCode = getStatusCode(err);

  res.status(statusCode).json(errorResponse);
}

/**
 * エラーからHTTPステータスコードを決定
 */
function getStatusCode(error: unknown): number {
  if (error instanceof RecipeValidationError) {
    return 400;
  }

  if (error instanceof ZodError) {
    return 400;
  }

  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return 404;
    }
    if (error.message.includes('already exists')) {
      return 409;
    }
  }

  return 500;
}

/**
 * 非同期ルートハンドラをラップしてエラーを次のミドルウェアに渡す
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
