import { INotificationProvider } from '../INotificationProvider';
import { Recipe } from '../../../models/recipe';
import { RecipeExecution } from '../../../models/recipeExecution';

/**
 * No-Op通知プロバイダー
 *
 * 通知を送信しない実装。開発・テスト用。
 */
export class NoOpNotificationProvider implements INotificationProvider {
  async notifyRecipeCreated(recipe: Recipe): Promise<void> {
    // No-op
  }

  async notifyRecipeUpdated(recipe: Recipe, changes?: Record<string, any>): Promise<void> {
    // No-op
  }

  async notifyRecipeDeleted(recipeId: string, recipeName?: string): Promise<void> {
    // No-op
  }

  async notifyExecutionStarted(execution: RecipeExecution): Promise<void> {
    // No-op
  }

  async notifyExecutionCompleted(execution: RecipeExecution): Promise<void> {
    // No-op
  }

  async notifyExecutionFailed(execution: RecipeExecution, error: Error): Promise<void> {
    // No-op
  }

  async notifyError(error: Error, context?: Record<string, any>): Promise<void> {
    // No-op
  }
}

/**
 * コンソール通知プロバイダー
 *
 * 通知をコンソールに出力する実装。開発用。
 */
export class ConsoleNotificationProvider implements INotificationProvider {
  async notifyRecipeCreated(recipe: Recipe): Promise<void> {
    console.log('[Notification] Recipe created:', recipe.id, recipe.name);
  }

  async notifyRecipeUpdated(recipe: Recipe, changes?: Record<string, any>): Promise<void> {
    console.log('[Notification] Recipe updated:', recipe.id, changes);
  }

  async notifyRecipeDeleted(recipeId: string, recipeName?: string): Promise<void> {
    console.log('[Notification] Recipe deleted:', recipeId, recipeName);
  }

  async notifyExecutionStarted(execution: RecipeExecution): Promise<void> {
    console.log('[Notification] Execution started:', execution.id, execution.recipeId);
  }

  async notifyExecutionCompleted(execution: RecipeExecution): Promise<void> {
    console.log('[Notification] Execution completed:', execution.id, execution.status);
  }

  async notifyExecutionFailed(execution: RecipeExecution, error: Error): Promise<void> {
    console.error('[Notification] Execution failed:', execution.id, error.message);
  }

  async notifyError(error: Error, context?: Record<string, any>): Promise<void> {
    console.error('[Notification] System error:', error.message, context);
  }
}
