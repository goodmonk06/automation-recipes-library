import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { formatError, formatSuccess } from '../api/errorHandler';
import { RecipeValidationError } from '../models/recipe';

describe('Error Handler', () => {
  describe('formatSuccess', () => {
    it('should format success response correctly', () => {
      const data = { message: 'Success', id: 123 };
      const result = formatSuccess(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      const result = formatSuccess(null);

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });
  });

  describe('formatError', () => {
    it('should format RecipeValidationError', () => {
      const error = new RecipeValidationError('Invalid recipe', 'id');
      const result = formatError(error);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Invalid recipe');
      expect(result.error.details).toEqual({ field: 'id' });
    });

    it('should format ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);

      const result = formatError(zodError);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.details).toBeDefined();
    });

    it('should format standard Error', () => {
      const error = new Error('Something went wrong');
      const result = formatError(error);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const error = 'string error';
      const result = formatError(error);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNKNOWN_ERROR');
      expect(result.error.message).toBe('Unknown error occurred');
    });
  });
});
