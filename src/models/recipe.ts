import { z } from 'zod';

/**
 * パラメータスキーマの定義
 */
export const ParamSchemaItemSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  default: z.any().optional(),
});

export type ParamSchemaItem = z.infer<typeof ParamSchemaItemSchema>;

/**
 * トリガー定義
 */
export const TriggerSchema = z.object({
  type: z.string(), // 'schedule', 'webhook', 'manual', etc.
  config: z.record(z.any()).optional(),
});

export type Trigger = z.infer<typeof TriggerSchema>;

/**
 * アクション定義
 */
export const ActionSchema = z.object({
  id: z.string(),
  service: z.string(), // 'slack', 'gcal', 'github', etc.
  operation: z.string(), // 'send_message', 'create_event', etc.
  params: z.record(z.any()).optional(),
});

export type Action = z.infer<typeof ActionSchema>;

/**
 * レシピ定義のスキーマ
 */
export const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().optional().default('1.0.0'),
  triggers: z.array(TriggerSchema),
  actions: z.array(ActionSchema),
  paramsSchema: z.record(ParamSchemaItemSchema).optional(),
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

/**
 * バリデーションエラー
 */
export class RecipeValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public filePath?: string
  ) {
    super(message);
    this.name = 'RecipeValidationError';
  }
}

/**
 * レシピをバリデーションする
 */
export function validateRecipe(data: unknown, filePath?: string): Recipe {
  try {
    return RecipeSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new RecipeValidationError(
        `Validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        filePath
      );
    }
    throw error;
  }
}
