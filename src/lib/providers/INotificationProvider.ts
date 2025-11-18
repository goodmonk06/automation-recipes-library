import { Recipe } from '../../models/recipe';
import { RecipeExecution } from '../../models/recipeExecution';

/**
 * 通知プロバイダーインターフェース
 *
 * レシピのライフサイクルイベントやエラーを外部システムに通知します。
 */
export interface INotificationProvider {
  /**
   * レシピ作成通知
   */
  notifyRecipeCreated(recipe: Recipe): Promise<void>;

  /**
   * レシピ更新通知
   */
  notifyRecipeUpdated(recipe: Recipe, changes?: Record<string, any>): Promise<void>;

  /**
   * レシピ削除通知
   */
  notifyRecipeDeleted(recipeId: string, recipeName?: string): Promise<void>;

  /**
   * レシピ実行開始通知
   */
  notifyExecutionStarted(execution: RecipeExecution): Promise<void>;

  /**
   * レシピ実行完了通知
   */
  notifyExecutionCompleted(execution: RecipeExecution): Promise<void>;

  /**
   * レシピ実行失敗通知
   */
  notifyExecutionFailed(execution: RecipeExecution, error: Error): Promise<void>;

  /**
   * システムエラー通知
   */
  notifyError(error: Error, context?: Record<string, any>): Promise<void>;
}

/**
 * 通知設定
 */
export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  filters?: NotificationFilter[];
}

/**
 * 通知チャネル
 */
export interface NotificationChannel {
  type: 'slack' | 'email' | 'webhook' | 'sms';
  config: Record<string, any>;
  events?: string[]; // 購読するイベントタイプ
}

/**
 * 通知フィルター
 */
export interface NotificationFilter {
  event: string;
  condition: (data: any) => boolean;
}
