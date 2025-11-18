import { z } from 'zod';

/**
 * 実行ステータス
 */
export const ExecutionStatus = z.enum([
  'pending',    // 実行待ち
  'running',    // 実行中
  'completed',  // 正常完了
  'failed',     // 失敗
  'cancelled',  // キャンセル
  'timeout',    // タイムアウト
]);

export type ExecutionStatusType = z.infer<typeof ExecutionStatus>;

/**
 * アクション実行結果
 */
export const ActionExecutionResultSchema = z.object({
  actionId: z.string(),
  status: ExecutionStatus,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  output: z.any().optional(),
  error: z.string().optional(),
  duration: z.number().optional(), // ミリ秒
});

export type ActionExecutionResult = z.infer<typeof ActionExecutionResultSchema>;

/**
 * レシピ実行記録
 *
 * レシピが実行されるたびに作成される実行ログ。
 * 実行結果、エラー、タイミング情報などを記録します。
 */
export const RecipeExecutionSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  recipeName: z.string().optional(),
  recipeVersion: z.string().optional(),
  status: ExecutionStatus,

  // タイミング
  triggeredAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  duration: z.number().optional(), // ミリ秒

  // トリガー情報
  triggerType: z.string(), // 'manual', 'schedule', 'webhook'
  triggerSource: z.string().optional(), // トリガー元（ユーザー、システムなど）
  triggerPayload: z.any().optional(),

  // 実行結果
  result: z.object({
    actions: z.array(ActionExecutionResultSchema).optional(),
    totalActions: z.number().optional(),
    successfulActions: z.number().optional(),
    failedActions: z.number().optional(),
  }).optional(),

  // エラー情報
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    stack: z.string().optional(),
    details: z.any().optional(),
  }).optional(),

  // メタデータ
  metadata: z.object({
    environment: z.string().optional(), // 'dev', 'staging', 'production'
    executionNode: z.string().optional(), // 実行ノードID
    correlationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

export type RecipeExecution = z.infer<typeof RecipeExecutionSchema>;

/**
 * 実行統計情報
 */
export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  lastExecution?: string;
  successRate: number;
}

/**
 * 実行検証エラー
 */
export class ExecutionValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public executionId?: string
  ) {
    super(message);
    this.name = 'ExecutionValidationError';
  }
}

/**
 * レシピ実行をバリデーションする
 */
export function validateExecution(data: unknown, executionId?: string): RecipeExecution {
  try {
    return RecipeExecutionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ExecutionValidationError(
        `Execution validation failed: ${firstError.message}`,
        firstError.path.join('.'),
        executionId
      );
    }
    throw error;
  }
}

/**
 * 実行統計を計算
 */
export function calculateExecutionStats(executions: RecipeExecution[]): ExecutionStats {
  const totalExecutions = executions.length;
  const successCount = executions.filter(e => e.status === 'completed').length;
  const failureCount = executions.filter(e => e.status === 'failed').length;

  const durationsCompleted = executions
    .filter(e => e.duration !== undefined)
    .map(e => e.duration!);

  const averageDuration = durationsCompleted.length > 0
    ? durationsCompleted.reduce((sum, d) => sum + d, 0) / durationsCompleted.length
    : 0;

  const lastExecution = executions.length > 0
    ? executions[executions.length - 1].triggeredAt
    : undefined;

  const successRate = totalExecutions > 0
    ? (successCount / totalExecutions) * 100
    : 0;

  return {
    totalExecutions,
    successCount,
    failureCount,
    averageDuration,
    lastExecution,
    successRate,
  };
}
