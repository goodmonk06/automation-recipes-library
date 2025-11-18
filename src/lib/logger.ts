/**
 * ログレベル
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * ログエントリ
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  correlationId?: string;
  error?: Error;
}

/**
 * ロガーインターフェース
 */
export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  fatal(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * 構造化ロガー
 *
 * コンテキスト情報を含む構造化ログを出力します。
 */
export class Logger implements ILogger {
  private minLevel: LogLevel;
  private correlationId?: string;
  private defaultContext: Record<string, any>;

  constructor(
    options: {
      minLevel?: LogLevel;
      correlationId?: string;
      defaultContext?: Record<string, any>;
    } = {}
  ) {
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.correlationId = options.correlationId;
    this.defaultContext = options.defaultContext || {};
  }

  /**
   * 相関IDを設定
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * 相関IDをクリア
   */
  clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  /**
   * デバッグログ
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 情報ログ
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 警告ログ
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * エラーログ
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * 致命的エラーログ
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * ログを出力
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
      correlationId: this.correlationId,
      error,
    };

    this.output(entry);
  }

  /**
   * ログを出力
   */
  private output(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}]`;
    const contextStr = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    const correlationStr = entry.correlationId ? ` [${entry.correlationId}]` : '';

    const logMessage = `${prefix}${correlationStr} ${entry.message}${contextStr}`;

    if (entry.level >= LogLevel.ERROR) {
      console.error(logMessage);
      if (entry.error) {
        console.error(entry.error);
      }
    } else if (entry.level === LogLevel.WARN) {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  /**
   * 子ロガーを作成
   */
  child(context: Record<string, any>): Logger {
    return new Logger({
      minLevel: this.minLevel,
      correlationId: this.correlationId,
      defaultContext: { ...this.defaultContext, ...context },
    });
  }
}

/**
 * グローバルロガーインスタンス
 */
export const logger = new Logger({
  minLevel: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
  defaultContext: {
    service: 'automation-recipes-library',
  },
});

/**
 * リクエストごとの相関IDを生成
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
