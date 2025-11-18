import express, { Request, Response } from 'express';
import path from 'path';
import {
  loadRecipesFromDirectory,
  findRecipeById,
  findRecipesByTag,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../loader/recipeLoader';
import { RecipeSchema } from '../models/recipe';
import { asyncHandler, errorHandler, formatSuccess, formatError } from './errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;
const RECIPES_DIR = process.env.RECIPES_DIR || path.join(process.cwd(), 'recipes');

// ミドルウェア
app.use(express.json());

/**
 * ヘルスチェック
 */
app.get('/health', (req: Request, res: Response) => {
  res.json(formatSuccess({ status: 'ok', timestamp: new Date().toISOString() }));
});

/**
 * レシピ一覧を取得
 * GET /api/recipes?tag=<tag>
 */
app.get('/api/recipes', asyncHandler(async (req: Request, res: Response) => {
  const { tag } = req.query;

  let recipes;
  if (tag && typeof tag === 'string') {
    recipes = await findRecipesByTag(RECIPES_DIR, tag);
  } else {
    recipes = await loadRecipesFromDirectory(RECIPES_DIR);
  }

  res.json(formatSuccess({
    count: recipes.length,
    recipes,
  }));
}));

/**
 * 新しいレシピを作成
 * POST /api/recipes
 */
app.post('/api/recipes', asyncHandler(async (req: Request, res: Response) => {
  // バリデーション
  const recipe = RecipeSchema.parse(req.body);

  // レシピ作成
  const result = await createRecipe(RECIPES_DIR, recipe);

  if (!result.success) {
    const statusCode = result.error?.includes('already exists') ? 409 : 400;
    res.status(statusCode).json(formatError(new Error(result.error)));
    return;
  }

  res.status(201).json(formatSuccess({
    message: 'Recipe created successfully',
    recipe,
    filePath: result.filePath,
  }));
}));

/**
 * 特定のレシピを取得
 * GET /api/recipes/:id
 */
app.get('/api/recipes/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = await findRecipeById(RECIPES_DIR, id);

  if (!recipe) {
    res.status(404).json(formatError(new Error(`Recipe not found: ${id}`)));
    return;
  }

  res.json(formatSuccess({ recipe }));
}));

/**
 * レシピを更新
 * PUT /api/recipes/:id
 */
app.put('/api/recipes/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // バリデーション
  const recipe = RecipeSchema.parse(req.body);

  // IDの一貫性チェック
  if (recipe.id !== id) {
    res.status(400).json(formatError(
      new Error(`Recipe ID mismatch: expected '${id}', got '${recipe.id}'`)
    ));
    return;
  }

  // レシピ更新
  const result = await updateRecipe(RECIPES_DIR, id, recipe);

  if (!result.success) {
    const statusCode = result.error?.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatError(new Error(result.error)));
    return;
  }

  res.json(formatSuccess({
    message: 'Recipe updated successfully',
    recipe,
    filePath: result.filePath,
  }));
}));

/**
 * レシピを削除
 * DELETE /api/recipes/:id
 */
app.delete('/api/recipes/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // レシピ削除
  const result = await deleteRecipe(RECIPES_DIR, id);

  if (!result.success) {
    const statusCode = result.error?.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatError(new Error(result.error)));
    return;
  }

  res.json(formatSuccess({
    message: 'Recipe deleted successfully',
    id,
  }));
}));

/**
 * レシピのメタデータのみを取得（軽量版）
 * GET /api/recipes/:id/metadata
 */
app.get('/api/recipes/:id/metadata', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = await findRecipeById(RECIPES_DIR, id);

  if (!recipe) {
    res.status(404).json(formatError(new Error(`Recipe not found: ${id}`)));
    return;
  }

  res.json(formatSuccess({
    metadata: {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      version: recipe.version,
      ...recipe.metadata,
    },
  }));
}));

// エラーハンドリングミドルウェア（最後に配置）
app.use(errorHandler);

/**
 * サーバー起動
 */
export function startServer(port?: number): void {
  const serverPort = port || PORT;

  app.listen(serverPort, () => {
    console.log(`Recipe API server running on port ${serverPort}`);
    console.log(`Recipes directory: ${RECIPES_DIR}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET    /health`);
    console.log(`  GET    /api/recipes`);
    console.log(`  GET    /api/recipes?tag=<tag>`);
    console.log(`  POST   /api/recipes`);
    console.log(`  GET    /api/recipes/:id`);
    console.log(`  PUT    /api/recipes/:id`);
    console.log(`  DELETE /api/recipes/:id`);
    console.log(`  GET    /api/recipes/:id/metadata`);
  });
}

// 直接実行された場合はサーバーを起動
if (require.main === module) {
  startServer();
}

export default app;
