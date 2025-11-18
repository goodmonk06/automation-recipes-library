import { Recipe } from '../../models/recipe';

/**
 * ストレージプロバイダーインターフェース
 *
 * レシピの永続化を抽象化します。
 * ファイルシステム、S3、データベースなど、異なるストレージバックエンドを
 * 実装できます。
 */
export interface IStorageProvider {
  /**
   * レシピを保存
   */
  save(recipe: Recipe): Promise<{ success: boolean; error?: string }>;

  /**
   * レシピを読み込み
   */
  load(id: string): Promise<Recipe | null>;

  /**
   * 全レシピを読み込み
   */
  loadAll(): Promise<Recipe[]>;

  /**
   * レシピを削除
   */
  delete(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * レシピが存在するか確認
   */
  exists(id: string): Promise<boolean>;

  /**
   * レシピを検索
   */
  search(query: StorageQuery): Promise<Recipe[]>;

  /**
   * ストレージの健全性チェック
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * ストレージクエリ
 */
export interface StorageQuery {
  tags?: string[];
  services?: string[];
  triggerTypes?: string[];
  author?: string;
  limit?: number;
  offset?: number;
}

/**
 * ストレージプロバイダーの設定
 */
export interface StorageProviderConfig {
  type: 'filesystem' | 's3' | 'database' | 'memory';
  basePath?: string;
  connectionString?: string;
  options?: Record<string, any>;
}
