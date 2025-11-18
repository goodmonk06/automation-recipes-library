import { IMetricsProvider, MetricLabels } from '../IMetricsProvider';

interface MetricEntry {
  name: string;
  value: number;
  labels: MetricLabels;
  timestamp: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timing' | 'custom';
}

/**
 * インメモリメトリクスプロバイダー
 *
 * 開発・テスト用のシンプルなメトリクス実装。
 * メトリクスをメモリに保存し、コンソールに出力します。
 */
export class InMemoryMetricsProvider implements IMetricsProvider {
  private metrics: MetricEntry[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  async incrementCounter(name: string, value: number = 1, labels?: MetricLabels): Promise<void> {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.metrics.push({
      name,
      value: current + value,
      labels: labels || {},
      timestamp: new Date().toISOString(),
      type: 'counter',
    });
  }

  async setGauge(name: string, value: number, labels?: MetricLabels): Promise<void> {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);

    this.metrics.push({
      name,
      value,
      labels: labels || {},
      timestamp: new Date().toISOString(),
      type: 'gauge',
    });
  }

  async recordHistogram(name: string, value: number, labels?: MetricLabels): Promise<void> {
    this.metrics.push({
      name,
      value,
      labels: labels || {},
      timestamp: new Date().toISOString(),
      type: 'histogram',
    });
  }

  async recordTiming(name: string, duration: number, labels?: MetricLabels): Promise<void> {
    this.metrics.push({
      name,
      value: duration,
      labels: labels || {},
      timestamp: new Date().toISOString(),
      type: 'timing',
    });
  }

  async recordCustom(name: string, value: any, labels?: MetricLabels): Promise<void> {
    this.metrics.push({
      name,
      value,
      labels: labels || {},
      timestamp: new Date().toISOString(),
      type: 'custom',
    });
  }

  async flush(): Promise<void> {
    if (this.metrics.length > 0) {
      console.log('[Metrics] Flushing metrics:', {
        totalMetrics: this.metrics.length,
        counters: Object.fromEntries(this.counters),
        gauges: Object.fromEntries(this.gauges),
      });
    }
  }

  /**
   * すべてのメトリクスを取得（テスト用）
   */
  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  /**
   * メトリクスをクリア
   */
  clear(): void {
    this.metrics = [];
    this.counters.clear();
    this.gauges.clear();
  }

  private getKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}
