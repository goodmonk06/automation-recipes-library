/**
 * メトリクスプロバイダーインターフェース
 *
 * システムメトリクスとビジネスメトリクスを収集します。
 */
export interface IMetricsProvider {
  /**
   * カウンターをインクリメント
   */
  incrementCounter(name: string, value?: number, labels?: MetricLabels): Promise<void>;

  /**
   * ゲージを設定
   */
  setGauge(name: string, value: number, labels?: MetricLabels): Promise<void>;

  /**
   * ヒストグラムに値を記録
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): Promise<void>;

  /**
   * タイミングを記録（ミリ秒）
   */
  recordTiming(name: string, duration: number, labels?: MetricLabels): Promise<void>;

  /**
   * カスタムメトリクスを記録
   */
  recordCustom(name: string, value: any, labels?: MetricLabels): Promise<void>;

  /**
   * メトリクスをフラッシュ
   */
  flush(): Promise<void>;
}

/**
 * メトリクスラベル
 */
export interface MetricLabels {
  [key: string]: string | number | boolean;
}

/**
 * メトリクス設定
 */
export interface MetricsConfig {
  enabled: boolean;
  provider: 'prometheus' | 'datadog' | 'cloudwatch' | 'custom';
  prefix?: string;
  flushInterval?: number; // ミリ秒
  defaultLabels?: MetricLabels;
}

/**
 * 一般的なメトリクス名
 */
export const MetricNames = {
  // レシピメトリクス
  RECIPE_CREATED: 'recipe.created',
  RECIPE_UPDATED: 'recipe.updated',
  RECIPE_DELETED: 'recipe.deleted',
  RECIPE_LOADED: 'recipe.loaded',

  // 実行メトリクス
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_COMPLETED: 'execution.completed',
  EXECUTION_FAILED: 'execution.failed',
  EXECUTION_DURATION: 'execution.duration',

  // APIメトリクス
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',
  API_LATENCY: 'api.latency',

  // システムメトリクス
  STORAGE_READ: 'storage.read',
  STORAGE_WRITE: 'storage.write',
  VALIDATION_ERROR: 'validation.error',
} as const;
