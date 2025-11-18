import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import {
  RecipeTemplate,
  validateTemplate,
  instantiateTemplate,
  extractVariables,
  TemplateValidationError,
} from '../models/recipeTemplate';
import { Recipe, validateRecipe } from '../models/recipe';

export interface TemplateLoadResult {
  success: boolean;
  template?: RecipeTemplate;
  error?: string;
  filePath: string;
}

/**
 * テンプレートを読み込む
 */
export async function loadTemplate(filePath: string): Promise<TemplateLoadResult> {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: 'File not found',
        filePath,
      };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = parseYAML(fileContent);
    const template = validateTemplate(data, filePath);

    return {
      success: true,
      template,
      filePath,
    };
  } catch (error) {
    if (error instanceof TemplateValidationError) {
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
 * ディレクトリ内のすべてのテンプレートを読み込む
 */
export async function loadTemplatesFromDirectory(dirPath: string): Promise<RecipeTemplate[]> {
  const templates: RecipeTemplate[] = [];

  if (!fs.existsSync(dirPath)) {
    return templates;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      const filePath = path.join(dirPath, file);
      const result = await loadTemplate(filePath);

      if (result.success && result.template) {
        templates.push(result.template);
      }
    }
  }

  return templates;
}

/**
 * テンプレートを作成
 */
export async function createTemplate(
  dirPath: string,
  template: RecipeTemplate
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const existingTemplate = await findTemplateById(dirPath, template.id);
    if (existingTemplate) {
      return {
        success: false,
        error: `Template with id '${template.id}' already exists`,
      };
    }

    validateTemplate(template);

    const filePath = path.join(dirPath, `${template.id}.yml`);
    const yamlContent = stringifyYAML(template);

    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * IDでテンプレートを検索
 */
export async function findTemplateById(
  dirPath: string,
  templateId: string
): Promise<RecipeTemplate | null> {
  const templates = await loadTemplatesFromDirectory(dirPath);
  return templates.find((t) => t.id === templateId) || null;
}

/**
 * テンプレートからレシピをインスタンス化
 */
export async function instantiateFromTemplate(
  template: RecipeTemplate,
  variables: Record<string, any>,
  recipeId?: string
): Promise<{ success: boolean; recipe?: Recipe; error?: string }> {
  try {
    // 必須変数のチェック
    const requiredVars = template.variables.filter(v => v.required).map(v => v.name);
    const missingVars = requiredVars.filter(v => !(v in variables));

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required variables: ${missingVars.join(', ')}`,
      };
    }

    // デフォルト値を適用
    const finalVariables = { ...variables };
    for (const variable of template.variables) {
      if (!(variable.name in finalVariables) && variable.default !== undefined) {
        finalVariables[variable.name] = variable.default;
      }
    }

    // テンプレートをインスタンス化
    const recipeData = instantiateTemplate(template.template, finalVariables);

    // レシピIDを設定
    if (recipeId) {
      recipeData.id = recipeId;
    }

    // レシピをバリデーション
    const recipe = validateRecipe(recipeData);

    return {
      success: true,
      recipe,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * レシピからテンプレートを作成
 */
export function createTemplateFromRecipe(
  recipe: Recipe,
  templateId: string,
  variableFields: string[]
): RecipeTemplate {
  const templateData = JSON.parse(JSON.stringify(recipe));

  // 指定されたフィールドを変数に置き換え
  const variables = variableFields.map(field => {
    const parts = field.split('.');
    let value: any = templateData;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      }
    }

    return {
      name: field.replace(/\./g, '_'),
      description: `Variable for ${field}`,
      type: typeof value as any,
      required: true,
      default: value,
    };
  });

  return {
    id: templateId,
    name: `${recipe.name} Template`,
    description: `Template created from recipe: ${recipe.name}`,
    template: templateData,
    variables,
    usageCount: 0,
    metadata: {
      ...recipe.metadata,
      createdAt: new Date().toISOString(),
    },
  };
}
