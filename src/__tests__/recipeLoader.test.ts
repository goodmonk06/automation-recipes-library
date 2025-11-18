import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadRecipe,
  loadRecipesFromDirectory,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  findRecipeById,
  validateRecipesInDirectory,
} from '../loader/recipeLoader';
import { Recipe } from '../models/recipe';

const TEST_DIR = path.join(__dirname, '__test_recipes__');

describe('Recipe Loader', () => {
  const testRecipe: Recipe = {
    id: 'test-loader-001',
    name: 'Test Loader Recipe',
    description: 'Recipe for testing loader functionality',
    version: '1.0.0',
    triggers: [{ type: 'manual' }],
    actions: [{ id: 'action-1', service: 'test', operation: 'test_op' }],
  };

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      const files = fs.readdirSync(TEST_DIR);
      files.forEach((file) => {
        fs.unlinkSync(path.join(TEST_DIR, file));
      });
      fs.rmdirSync(TEST_DIR);
    }
  });

  describe('createRecipe', () => {
    it('should create a new recipe file', async () => {
      const result = await createRecipe(TEST_DIR, testRecipe);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();

      const filePath = path.join(TEST_DIR, `${testRecipe.id}.yml`);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should prevent creating duplicate recipes', async () => {
      await createRecipe(TEST_DIR, testRecipe);
      const result = await createRecipe(TEST_DIR, testRecipe);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('loadRecipe', () => {
    it('should load a recipe from file', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const filePath = path.join(TEST_DIR, `${testRecipe.id}.yml`);
      const result = await loadRecipe(filePath);

      expect(result.success).toBe(true);
      expect(result.recipe).toBeDefined();
      expect(result.recipe?.id).toBe(testRecipe.id);
    });

    it('should return error for non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.yml');
      const result = await loadRecipe(filePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('updateRecipe', () => {
    it('should update an existing recipe', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const updatedRecipe = {
        ...testRecipe,
        description: 'Updated description',
      };

      const result = await updateRecipe(TEST_DIR, testRecipe.id, updatedRecipe);

      expect(result.success).toBe(true);

      const loaded = await findRecipeById(TEST_DIR, testRecipe.id);
      expect(loaded?.description).toBe('Updated description');
    });

    it('should prevent updating non-existent recipe', async () => {
      const result = await updateRecipe(TEST_DIR, 'non-existent', testRecipe);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should prevent ID mismatch', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const differentRecipe = {
        ...testRecipe,
        id: 'different-id',
      };

      const result = await updateRecipe(TEST_DIR, testRecipe.id, differentRecipe);

      expect(result.success).toBe(false);
      expect(result.error).toContain('mismatch');
    });
  });

  describe('deleteRecipe', () => {
    it('should delete an existing recipe', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const result = await deleteRecipe(TEST_DIR, testRecipe.id);

      expect(result.success).toBe(true);

      const filePath = path.join(TEST_DIR, `${testRecipe.id}.yml`);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should prevent deleting non-existent recipe', async () => {
      const result = await deleteRecipe(TEST_DIR, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('loadRecipesFromDirectory', () => {
    it('should load all recipes from directory', async () => {
      const recipe1 = { ...testRecipe, id: 'recipe-1' };
      const recipe2 = { ...testRecipe, id: 'recipe-2' };

      await createRecipe(TEST_DIR, recipe1);
      await createRecipe(TEST_DIR, recipe2);

      const recipes = await loadRecipesFromDirectory(TEST_DIR);

      expect(recipes).toHaveLength(2);
      expect(recipes.map((r) => r.id)).toContain('recipe-1');
      expect(recipes.map((r) => r.id)).toContain('recipe-2');
    });

    it('should return empty array for empty directory', async () => {
      const recipes = await loadRecipesFromDirectory(TEST_DIR);
      expect(recipes).toEqual([]);
    });
  });

  describe('findRecipeById', () => {
    it('should find recipe by ID', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const found = await findRecipeById(TEST_DIR, testRecipe.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(testRecipe.id);
    });

    it('should return null for non-existent ID', async () => {
      const found = await findRecipeById(TEST_DIR, 'non-existent');
      expect(found).toBeNull();
    });
  });

  describe('validateRecipesInDirectory', () => {
    it('should validate all recipes in directory', async () => {
      await createRecipe(TEST_DIR, testRecipe);

      const result = await validateRecipesInDirectory(TEST_DIR);

      expect(result.valid).toBe(true);
      expect(result.totalFiles).toBe(1);
      expect(result.validRecipes).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid recipes', async () => {
      // Create an invalid YAML file
      const invalidFilePath = path.join(TEST_DIR, 'invalid.yml');
      fs.writeFileSync(invalidFilePath, 'id: test\nname: incomplete');

      const result = await validateRecipesInDirectory(TEST_DIR);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
