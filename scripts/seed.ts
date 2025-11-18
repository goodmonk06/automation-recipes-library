#!/usr/bin/env tsx

import * as path from 'path';
import { createRecipe } from '../src/loader/recipeLoader';
import { Recipe } from '../src/models/recipe';

const RECIPES_DIR = process.env.RECIPES_DIR || path.join(process.cwd(), 'recipes');

const seedRecipes: Recipe[] = [
  {
    id: 'github-issue-to-slack',
    name: 'GitHub Issue通知をSlackに送信',
    description: 'GitHub Issueが作成されたときにSlackチャンネルに通知を送信する',
    version: '1.0.0',
    triggers: [
      {
        type: 'webhook',
        config: {
          endpoint: '/webhooks/github',
          method: 'POST',
          events: ['issues.opened'],
        },
      },
    ],
    actions: [
      {
        id: 'notify-slack',
        service: 'slack',
        operation: 'send_message',
        params: {
          channel: '{{slackChannel}}',
          message: 'New GitHub Issue: {{issue.title}} - {{issue.html_url}}',
          username: 'GitHub Bot',
          icon_emoji: ':github:',
        },
      },
    ],
    paramsSchema: {
      slackChannel: {
        type: 'string',
        description: '通知先のSlackチャンネル',
        required: true,
        default: '#dev-notifications',
      },
    },
    metadata: {
      author: 'automation-team',
      tags: ['github', 'slack', 'notification', 'webhook'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
  },
  {
    id: 'daily-standup-reminder',
    name: '毎日のスタンドアップリマインダー',
    description: '平日9:00にスタンドアップミーティングのリマインダーを送信',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        config: {
          cron: '0 9 * * 1-5',
          timezone: 'Asia/Tokyo',
          description: '平日9:00に実行',
        },
      },
    ],
    actions: [
      {
        id: 'send-reminder',
        service: 'slack',
        operation: 'send_message',
        params: {
          channel: '{{channel}}',
          message: ':wave: おはようございます！今日のスタンドアップの時間です。\n\n今日のタスクを共有しましょう！',
          username: 'Standup Bot',
          icon_emoji: ':calendar:',
        },
      },
    ],
    paramsSchema: {
      channel: {
        type: 'string',
        description: 'リマインダーを送信するチャンネル',
        required: true,
        default: '#standup',
      },
    },
    metadata: {
      author: 'automation-team',
      tags: ['slack', 'schedule', 'reminder', 'standup'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
  },
  {
    id: 'meeting-scheduler',
    name: 'ミーティング自動スケジューラー',
    description: 'フォーム送信時にGoogleカレンダーにミーティングを自動作成',
    version: '1.0.0',
    triggers: [
      {
        type: 'webhook',
        config: {
          endpoint: '/webhooks/schedule-meeting',
          method: 'POST',
        },
      },
    ],
    actions: [
      {
        id: 'create-calendar-event',
        service: 'gcal',
        operation: 'create_event',
        params: {
          calendarId: '{{calendarId}}',
          summary: '{{meetingTitle}}',
          description: '{{meetingDescription}}',
          startTime: '{{startTime}}',
          endTime: '{{endTime}}',
          attendees: '{{attendees}}',
          location: '{{location}}',
        },
      },
      {
        id: 'notify-attendees',
        service: 'slack',
        operation: 'send_message',
        params: {
          channel: '{{notificationChannel}}',
          message: 'ミーティング「{{meetingTitle}}」が{{startTime}}にスケジュールされました。',
        },
      },
    ],
    paramsSchema: {
      calendarId: {
        type: 'string',
        description: 'Googleカレンダーの ID',
        required: true,
        default: 'primary',
      },
      meetingTitle: {
        type: 'string',
        description: 'ミーティングのタイトル',
        required: true,
      },
      meetingDescription: {
        type: 'string',
        description: 'ミーティングの詳細',
        required: false,
        default: '',
      },
      startTime: {
        type: 'string',
        description: '開始時刻 (ISO 8601)',
        required: true,
      },
      endTime: {
        type: 'string',
        description: '終了時刻 (ISO 8601)',
        required: true,
      },
      attendees: {
        type: 'array',
        description: '参加者のメールアドレス',
        required: false,
      },
      location: {
        type: 'string',
        description: 'ミーティングの場所',
        required: false,
        default: 'Zoom',
      },
      notificationChannel: {
        type: 'string',
        description: '通知を送るSlackチャンネル',
        required: false,
        default: '#general',
      },
    },
    metadata: {
      author: 'automation-team',
      tags: ['google-calendar', 'slack', 'scheduling', 'webhook'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
  },
  {
    id: 'pr-review-reminder',
    name: 'PRレビューリマインダー',
    description: '未レビューのPRがあるときにSlackでレビュー依頼を送信',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        config: {
          cron: '0 10,14 * * 1-5',
          timezone: 'Asia/Tokyo',
          description: '平日10:00と14:00に実行',
        },
      },
    ],
    actions: [
      {
        id: 'fetch-open-prs',
        service: 'github',
        operation: 'list_pull_requests',
        params: {
          repo: '{{repository}}',
          state: 'open',
          reviewStatus: 'pending',
        },
      },
      {
        id: 'send-reminder',
        service: 'slack',
        operation: 'send_message',
        params: {
          channel: '{{channel}}',
          message: ':eyes: レビュー待ちのPRがあります！\n{{prList}}',
        },
      },
    ],
    paramsSchema: {
      repository: {
        type: 'string',
        description: 'GitHubリポジトリ (owner/repo)',
        required: true,
      },
      channel: {
        type: 'string',
        description: '通知を送るSlackチャンネル',
        required: true,
        default: '#dev-team',
      },
    },
    metadata: {
      author: 'automation-team',
      tags: ['github', 'slack', 'pr-review', 'schedule'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
  },
  {
    id: 'error-alert-aggregator',
    name: 'エラーアラート集約',
    description: 'エラーログを集約して1時間ごとにサマリーを送信',
    version: '1.0.0',
    triggers: [
      {
        type: 'schedule',
        config: {
          cron: '0 * * * *',
          timezone: 'Asia/Tokyo',
          description: '毎時0分に実行',
        },
      },
    ],
    actions: [
      {
        id: 'aggregate-errors',
        service: 'monitoring',
        operation: 'get_error_summary',
        params: {
          timeRange: '1h',
          severity: ['error', 'critical'],
        },
      },
      {
        id: 'send-alert',
        service: 'slack',
        operation: 'send_message',
        params: {
          channel: '{{alertChannel}}',
          message: ':rotating_light: 過去1時間のエラーサマリー:\n{{errorSummary}}',
          username: 'Error Monitor',
          icon_emoji: ':warning:',
        },
      },
    ],
    paramsSchema: {
      alertChannel: {
        type: 'string',
        description: 'アラートを送信するチャンネル',
        required: true,
        default: '#alerts',
      },
    },
    metadata: {
      author: 'automation-team',
      tags: ['monitoring', 'slack', 'alerts', 'schedule'],
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-01-15T00:00:00Z',
    },
  },
];

async function seed() {
  console.log(`Seeding recipes to ${RECIPES_DIR}...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const recipe of seedRecipes) {
    try {
      const result = await createRecipe(RECIPES_DIR, recipe);

      if (result.success) {
        console.log(`✓ Created: ${recipe.id}`);
        created++;
      } else {
        if (result.error?.includes('already exists')) {
          console.log(`⊘ Skipped (already exists): ${recipe.id}`);
          skipped++;
        } else {
          console.error(`✗ Error creating ${recipe.id}: ${result.error}`);
          errors++;
        }
      }
    } catch (error) {
      console.error(`✗ Error creating ${recipe.id}:`, error);
      errors++;
    }
  }

  console.log(`\nSeed Summary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${seedRecipes.length}`);

  if (errors > 0) {
    process.exit(1);
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
