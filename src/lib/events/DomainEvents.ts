import { Recipe } from '../../models/recipe';
import { RecipeExecution } from '../../models/recipeExecution';
import { RecipeTemplate } from '../../models/recipeTemplate';
import { RecipeCollection } from '../../models/recipeCollection';

/**
 * ドメインイベントの基底型
 */
export interface DomainEvent<T = any> {
  type: string;
  timestamp: string;
  correlationId?: string;
  data: T;
  metadata?: Record<string, any>;
}

/**
 * イベントハンドラー型
 */
export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

/**
 * レシピイベント
 */
export interface RecipeCreatedEvent extends DomainEvent<{ recipe: Recipe }> {
  type: 'recipe.created';
}

export interface RecipeUpdatedEvent extends DomainEvent<{
  recipe: Recipe;
  previousVersion?: Recipe;
  changes?: Record<string, any>;
}> {
  type: 'recipe.updated';
}

export interface RecipeDeletedEvent extends DomainEvent<{
  recipeId: string;
  recipeName?: string;
}> {
  type: 'recipe.deleted';
}

/**
 * 実行イベント
 */
export interface ExecutionStartedEvent extends DomainEvent<{ execution: RecipeExecution }> {
  type: 'execution.started';
}

export interface ExecutionCompletedEvent extends DomainEvent<{ execution: RecipeExecution }> {
  type: 'execution.completed';
}

export interface ExecutionFailedEvent extends DomainEvent<{
  execution: RecipeExecution;
  error: Error;
}> {
  type: 'execution.failed';
}

/**
 * テンプレートイベント
 */
export interface TemplateCreatedEvent extends DomainEvent<{ template: RecipeTemplate }> {
  type: 'template.created';
}

export interface TemplateInstantiatedEvent extends DomainEvent<{
  template: RecipeTemplate;
  recipe: Recipe;
  variables: Record<string, any>;
}> {
  type: 'template.instantiated';
}

/**
 * コレクションイベント
 */
export interface CollectionCreatedEvent extends DomainEvent<{ collection: RecipeCollection }> {
  type: 'collection.created';
}

export interface CollectionUpdatedEvent extends DomainEvent<{ collection: RecipeCollection }> {
  type: 'collection.updated';
}

/**
 * すべてのイベント型のユニオン
 */
export type RecipeEvent =
  | RecipeCreatedEvent
  | RecipeUpdatedEvent
  | RecipeDeletedEvent
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | ExecutionFailedEvent
  | TemplateCreatedEvent
  | TemplateInstantiatedEvent
  | CollectionCreatedEvent
  | CollectionUpdatedEvent;

/**
 * イベント名の定数
 */
export const EventTypes = {
  RECIPE_CREATED: 'recipe.created',
  RECIPE_UPDATED: 'recipe.updated',
  RECIPE_DELETED: 'recipe.deleted',
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_COMPLETED: 'execution.completed',
  EXECUTION_FAILED: 'execution.failed',
  TEMPLATE_CREATED: 'template.created',
  TEMPLATE_INSTANTIATED: 'template.instantiated',
  COLLECTION_CREATED: 'collection.created',
  COLLECTION_UPDATED: 'collection.updated',
} as const;

/**
 * イベントバス
 *
 * ドメインイベントを発行し、購読するためのシンプルなイベントバス。
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  /**
   * イベントを購読
   */
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // 購読解除関数を返す
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * すべてのイベントを購読
   */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * イベントを発行
   */
  async emit<T = any>(event: DomainEvent<T>): Promise<void> {
    // 特定のイベントタイプのハンドラーを実行
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      await Promise.all(
        Array.from(typeHandlers).map(handler =>
          Promise.resolve(handler(event)).catch(err =>
            console.error(`Event handler error for ${event.type}:`, err)
          )
        )
      );
    }

    // グローバルハンドラーを実行
    await Promise.all(
      Array.from(this.globalHandlers).map(handler =>
        Promise.resolve(handler(event)).catch(err =>
          console.error('Global event handler error:', err)
        )
      )
    );
  }

  /**
   * すべてのハンドラーをクリア
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }

  /**
   * 購読者数を取得
   */
  listenerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.size ?? 0;
    }
    return Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0) + this.globalHandlers.size;
  }
}

/**
 * グローバルイベントバスのシングルトンインスタンス
 */
export const globalEventBus = new EventBus();

/**
 * イベントヘルパー関数
 */
export function createEvent<T>(
  type: string,
  data: T,
  correlationId?: string,
  metadata?: Record<string, any>
): DomainEvent<T> {
  return {
    type,
    timestamp: new Date().toISOString(),
    correlationId,
    data,
    metadata,
  };
}
