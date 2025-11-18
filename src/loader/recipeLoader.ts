import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYAML } from 'yaml';
import { Recipe, validateRecipe, RecipeValidationError } from '../models/recipe';

export interface LoadResult {
  success: boolean;
  recipe?: Recipe;
  error?: string;
  filePath: string;
}

export interface ValidationResult {
  valid: boolean;
  totalFiles: number;
  validRecipes: number;
  errors: Array<{
    filePath: string;
    error: string;
    field?: string;
  }>;
}

/**
 * 単一のYAMLファイルからレシピを読み込む
 */
export async function loadRecipe(filePath: string): Promise<LoadResult> {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: 'File not found',
        filePath,
      };
    }

    // YAMLファイルの読み込み
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // YAMLパース
    const data = parseYAML(fileContent);

    // バリデーション
    const recipe = validateRecipe(data, filePath);

    return {
      success: true,
      recipe,
      filePath,
    };
  } catch (error) {
    if (error instanceof RecipeValidationError) {
      return {
        success: false,
        error: error.message,
        filePath,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      filePath,
    };
  }
}

/**
 * ディレクトリ内のすべてのYAMLファイルを読み込む
 */
export async function loadRecipesFromDirectory(dirPath: string): Promise<Recipe[]> {
  const recipes: Recipe[] = [];

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      const filePath = path.join(dirPath, file);
      const result = await loadRecipe(filePath);

      if (result.success && result.recipe) {
        recipes.push(result.recipe);
      }
    }
  }

  return recipes;
}

/**
 * ディレクトリ内のすべてのYAMLファイルを検証する
 */
export async function validateRecipesInDirectory(dirPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    totalFiles: 0,
    validRecipes: 0,
    errors: [],
  };

  if (!fs.existsSync(dirPath)) {
    result.valid = false;
    result.errors.push({
      filePath: dirPath,
      error: 'Directory not found',
    });
    return result;
  }

  const files = fs.readdirSync(dirPath);
  const yamlFiles = files.filter(
    (file) => file.endsWith('.yml') || file.endsWith('.yaml')
  );

  result.totalFiles = yamlFiles.length;

  for (const file of yamlFiles) {
    const filePath = path.join(dirPath, file);
    const loadResult = await loadRecipe(filePath);

    if (loadResult.success) {
      result.validRecipes++;
    } else {
      result.valid = false;
      result.errors.push({
        filePath: loadResult.filePath,
        error: loadResult.error || 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * IDでレシピを検索
 */
export async function findRecipeById(
  dirPath: string,
  recipeId: string
): Promise<Recipe | null> {
  const recipes = await loadRecipesFromDirectory(dirPath);
  return recipes.find((recipe) => recipe.id === recipeId) || null;
}

/**
 * タグでレシピを検索
 */
export async function findRecipesByTag(
  dirPath: string,
  tag: string
): Promise<Recipe[]> {
  const recipes = await loadRecipesFromDirectory(dirPath);
  return recipes.filter((recipe) =>
    recipe.metadata?.tags?.includes(tag)
  );
}
