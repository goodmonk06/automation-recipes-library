import { Recipe } from '../../models/recipe';

/**
 * バリデーションプロバイダーインターフェース
 *
 * カスタムビジネスルールバリデーションを実装します。
 */
export interface IValidationProvider {
  /**
   * レシピをバリデーション
   */
  validate(recipe: Recipe): Promise<ValidationResult>;

  /**
   * バリデーションルールを追加
   */
  addRule(rule: ValidationRule): void;

  /**
   * バリデーションルールを削除
   */
  removeRule(ruleId: string): void;

  /**
   * すべてのバリデーションルールを取得
   */
  getRules(): ValidationRule[];
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
  rule: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * バリデーション警告
 */
export interface ValidationWarning {
  rule: string;
  field?: string;
  message: string;
  suggestion?: string;
}

/**
 * バリデーションルール
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning';
  validate: (recipe: Recipe) => Promise<boolean | { valid: boolean; message: string }>;
}

/**
 * 組み込みバリデーションルール
 */
export const BuiltInValidationRules = {
  NO_EMPTY_TRIGGERS: {
    id: 'no-empty-triggers',
    name: 'No Empty Triggers',
    description: 'Recipe must have at least one trigger',
    severity: 'error' as const,
    validate: async (recipe: Recipe) => {
      if (recipe.triggers.length === 0) {
        return { valid: false, message: 'Recipe must have at least one trigger' };
      }
      return true;
    },
  },

  NO_EMPTY_ACTIONS: {
    id: 'no-empty-actions',
    name: 'No Empty Actions',
    description: 'Recipe must have at least one action',
    severity: 'error' as const,
    validate: async (recipe: Recipe) => {
      if (recipe.actions.length === 0) {
        return { valid: false, message: 'Recipe must have at least one action' };
      }
      return true;
    },
  },

  UNIQUE_ACTION_IDS: {
    id: 'unique-action-ids',
    name: 'Unique Action IDs',
    description: 'All action IDs must be unique within a recipe',
    severity: 'error' as const,
    validate: async (recipe: Recipe) => {
      const ids = recipe.actions.map(a => a.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        return { valid: false, message: 'Action IDs must be unique' };
      }
      return true;
    },
  },

  REASONABLE_CRON: {
    id: 'reasonable-cron',
    name: 'Reasonable Cron Schedule',
    description: 'Cron schedules should not be too frequent',
    severity: 'warning' as const,
    validate: async (recipe: Recipe) => {
      const scheduleTriggers = recipe.triggers.filter(t => t.type === 'schedule');
      for (const trigger of scheduleTriggers) {
        const cron = trigger.config?.cron as string;
        if (cron && cron.startsWith('* * * * *')) {
          return { valid: false, message: 'Cron schedule runs every minute; consider less frequent schedule' };
        }
      }
      return true;
    },
  },
} as const;
