import { IStorageProvider } from '../providers/IStorageProvider';
import { INotificationProvider } from '../providers/INotificationProvider';
import { IMetricsProvider} from '../providers/IMetricsProvider';
import { IValidationProvider } from '../providers/IValidationProvider';

/**
 * プラグインインターフェース
 */
export interface Plugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * プラグインレジストリ
 *
 * システム全体で使用されるプロバイダーとプラグインを管理します。
 */
export class PluginRegistry {
  private static instance: PluginRegistry;

  private storageProvider?: IStorageProvider;
  private notificationProvider?: INotificationProvider;
  private metricsProvider?: IMetricsProvider;
  private validationProvider?: IValidationProvider;
  private plugins: Map<string, Plugin> = new Map();

  private constructor() {}

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * ストレージプロバイダーを登録
   */
  registerStorageProvider(provider: IStorageProvider): void {
    this.storageProvider = provider;
  }

  /**
   * ストレージプロバイダーを取得
   */
  getStorageProvider(): IStorageProvider | undefined {
    return this.storageProvider;
  }

  /**
   * 通知プロバイダーを登録
   */
  registerNotificationProvider(provider: INotificationProvider): void {
    this.notificationProvider = provider;
  }

  /**
   * 通知プロバイダーを取得
   */
  getNotificationProvider(): INotificationProvider | undefined {
    return this.notificationProvider;
  }

  /**
   * メトリクスプロバイダーを登録
   */
  registerMetricsProvider(provider: IMetricsProvider): void {
    this.metricsProvider = provider;
  }

  /**
   * メトリクスプロバイダーを取得
   */
  getMetricsProvider(): IMetricsProvider | undefined {
    return this.metricsProvider;
  }

  /**
   * バリデーションプロバイダーを登録
   */
  registerValidationProvider(provider: IValidationProvider): void {
    this.validationProvider = provider;
  }

  /**
   * バリデーションプロバイダーを取得
   */
  getValidationProvider(): IValidationProvider | undefined {
    return this.validationProvider;
  }

  /**
   * プラグインを登録
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    await plugin.initialize();
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * プラグインを取得
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * すべてのプラグインを取得
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * プラグインを登録解除
   */
  async unregisterPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.shutdown();
      this.plugins.delete(name);
    }
  }

  /**
   * すべてのプラグインをシャットダウン
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.plugins.values()).map(plugin =>
      plugin.shutdown().catch(err => console.error(`Error shutting down plugin ${plugin.name}:`, err))
    );

    await Promise.all(shutdownPromises);
    this.plugins.clear();
  }

  /**
   * レジストリをリセット（テスト用）
   */
  reset(): void {
    this.storageProvider = undefined;
    this.notificationProvider = undefined;
    this.metricsProvider = undefined;
    this.validationProvider = undefined;
    this.plugins.clear();
  }
}

/**
 * グローバルレジストリインスタンス
 */
export const pluginRegistry = PluginRegistry.getInstance();
