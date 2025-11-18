import express, { Request, Response } from 'express';
import path from 'path';
import {
  loadRecipesFromDirectory,
  findRecipeById,
  findRecipesByTag,
} from '../loader/recipeLoader';

const app = express();
const PORT = process.env.PORT || 3000;
const RECIPES_DIR = process.env.RECIPES_DIR || path.join(process.cwd(), 'recipes');

// JSONパース用ミドルウェア
app.use(express.json());

/**
 * ヘルスチェック
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * レシピ一覧を取得
 * GET /api/recipes
 * クエリパラメータ:
 *   - tag: タグでフィルタリング
 */
app.get('/api/recipes', async (req: Request, res: Response) => {
  try {
    const { tag } = req.query;

    let recipes;
    if (tag && typeof tag === 'string') {
      recipes = await findRecipesByTag(RECIPES_DIR, tag);
    } else {
      recipes = await loadRecipesFromDirectory(RECIPES_DIR);
    }

    res.json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 特定のレシピを取得
 * GET /api/recipes/:id
 */
app.get('/api/recipes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await findRecipeById(RECIPES_DIR, id);

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: `Recipe not found: ${id}`,
      });
      return;
    }

    res.json({
      success: true,
      recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * レシピのメタデータのみを取得（軽量版）
 * GET /api/recipes/:id/metadata
 */
app.get('/api/recipes/:id/metadata', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await findRecipeById(RECIPES_DIR, id);

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: `Recipe not found: ${id}`,
      });
      return;
    }

    res.json({
      success: true,
      metadata: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        version: recipe.version,
        ...recipe.metadata,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * サーバー起動
 */
export function startServer(port?: number): void {
  const serverPort = port || PORT;

  app.listen(serverPort, () => {
    console.log(`Recipe API server running on port ${serverPort}`);
    console.log(`Recipes directory: ${RECIPES_DIR}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET /health`);
    console.log(`  GET /api/recipes`);
    console.log(`  GET /api/recipes?tag=<tag>`);
    console.log(`  GET /api/recipes/:id`);
    console.log(`  GET /api/recipes/:id/metadata`);
  });
}

// 直接実行された場合はサーバーを起動
if (require.main === module) {
  startServer();
}

export default app;
