import { describe, it, expect } from 'vitest';
import { validateRecipe, RecipeValidationError, Recipe } from '../models/recipe';

describe('Recipe Model', () => {
  const validRecipe: Recipe = {
    id: 'test-recipe-001',
    name: 'Test Recipe',
    description: 'A test recipe for validation',
    version: '1.0.0',
    triggers: [
      {
        type: 'manual',
        config: { description: 'Manual trigger' },
      },
    ],
    actions: [
      {
        id: 'action-1',
        service: 'test',
        operation: 'test_operation',
        params: {},
      },
    ],
    paramsSchema: {
      testParam: {
        type: 'string',
        description: 'Test parameter',
        required: true,
      },
    },
    metadata: {
      author: 'test-author',
      tags: ['test', 'validation'],
    },
  };

  describe('validateRecipe', () => {
    it('should validate a correct recipe', () => {
      expect(() => validateRecipe(validRecipe)).not.toThrow();
      const result = validateRecipe(validRecipe);
      expect(result).toEqual(validRecipe);
    });

    it('should throw RecipeValidationError for missing required fields', () => {
      const invalidRecipe = { ...validRecipe };
      delete (invalidRecipe as any).id;

      expect(() => validateRecipe(invalidRecipe)).toThrow(RecipeValidationError);
    });

    it('should throw RecipeValidationError for invalid field types', () => {
      const invalidRecipe = {
        ...validRecipe,
        triggers: 'not-an-array', // Should be array
      };

      expect(() => validateRecipe(invalidRecipe)).toThrow(RecipeValidationError);
    });

    it('should handle missing optional fields', () => {
      const minimalRecipe = {
        id: 'minimal-001',
        name: 'Minimal Recipe',
        description: 'Minimal test',
        triggers: [],
        actions: [],
      };

      expect(() => validateRecipe(minimalRecipe)).not.toThrow();
      const result = validateRecipe(minimalRecipe);
      expect(result.version).toBe('1.0.0'); // Default value
    });

    it('should validate triggers correctly', () => {
      const recipeWithMultipleTriggers = {
        ...validRecipe,
        triggers: [
          { type: 'manual', config: {} },
          { type: 'schedule', config: { cron: '0 9 * * *' } },
          { type: 'webhook', config: { endpoint: '/hook' } },
        ],
      };

      expect(() => validateRecipe(recipeWithMultipleTriggers)).not.toThrow();
    });

    it('should validate actions correctly', () => {
      const recipeWithMultipleActions = {
        ...validRecipe,
        actions: [
          { id: 'action-1', service: 'slack', operation: 'send_message' },
          { id: 'action-2', service: 'gcal', operation: 'create_event', params: { calendar: 'primary' } },
        ],
      };

      expect(() => validateRecipe(recipeWithMultipleActions)).not.toThrow();
    });

    it('should validate paramsSchema types', () => {
      const recipeWithParams = {
        ...validRecipe,
        paramsSchema: {
          stringParam: { type: 'string' as const, required: true },
          numberParam: { type: 'number' as const, required: false },
          boolParam: { type: 'boolean' as const, default: true },
          objectParam: { type: 'object' as const },
          arrayParam: { type: 'array' as const },
        },
      };

      expect(() => validateRecipe(recipeWithParams)).not.toThrow();
    });
  });
});
