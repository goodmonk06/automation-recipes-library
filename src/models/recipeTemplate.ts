import { z } from 'zod';

/**
 * テンプレート変数定義
 */
export const TemplateVariableSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean().optional().default(false),
  default: z.any().optional(),
  placeholder: z.string().optional(),
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

/**
 * レシピテンプレート定義
 *
 * テンプレートは再利用可能なレシピパターンで、変数を含むことができます。
 * 変数は{{variableName}}の形式でレシピ内に埋め込まれます。
 */
export const RecipeTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  template: z.record(z.any()), // Recipe構造だが変数を含む
  variables: z.array(TemplateVariableSchema),
  usageCount: z.number().optional().default(0),
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }).optional(),
});

export type RecipeTemplate = z.infer<typeof RecipeTemplateSchema>;

/**
 * テンプレート検証エラー
 */
export class TemplateValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public templateId?: string
  ) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}

/**
 * テンプレートをバリデーションする
 */
export function validateTemplate(data: unknown, templateId?: string): RecipeTemplate {
  try {
    return RecipeTemplateSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new TemplateValidationError(
        `Template validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        templateId
      );
    }
    throw error;
  }
}

/**
 * テンプレートから変数を抽出
 */
export function extractVariables(template: Record<string, any>): string[] {
  const variables = new Set<string>();
  const regex = /\{\{(\w+)\}\}/g;

  const traverse = (obj: any) => {
    if (typeof obj === 'string') {
      const matches = obj.matchAll(regex);
      for (const match of matches) {
        variables.add(match[1]);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(traverse);
    }
  };

  traverse(template);
  return Array.from(variables);
}

/**
 * テンプレート変数を実際の値で置換
 */
export function instantiateTemplate(
  template: Record<string, any>,
  variables: Record<string, any>
): Record<string, any> {
  const stringify = JSON.stringify(template);
  let result = stringify;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, JSON.stringify(value).replace(/^"|"$/g, ''));
  }

  return JSON.parse(result);
}
