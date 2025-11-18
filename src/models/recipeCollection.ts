import { z } from 'zod';

/**
 * レシピコレクション定義
 *
 * 関連するレシピをグループ化するためのコレクション。
 * カテゴリ、タグ、説明を持ち、レシピを整理します。
 */
export const RecipeCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(), // 'productivity', 'devops', 'communication' など
  recipeIds: z.array(z.string()),

  // 表示設定
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional().default(0),

  // メタデータ
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).optional(),
});

export type RecipeCollection = z.infer<typeof RecipeCollectionSchema>;

/**
 * コレクション統計情報
 */
export interface CollectionStats {
  totalRecipes: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
  totalExecutions?: number;
}

/**
 * コレクション検証エラー
 */
export class CollectionValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public collectionId?: string
  ) {
    super(message);
    this.name = 'CollectionValidationError';
  }
}

/**
 * コレクションをバリデーションする
 */
export function validateCollection(data: unknown, collectionId?: string): RecipeCollection {
  try {
    return RecipeCollectionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new CollectionValidationError(
        `Collection validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        collectionId
      );
    }
    throw error;
  }
}
