# automation-recipes-library

各サービス間の自動連携レシピをYAMLで管理し、実行エンジンから読み込めるようにするレシピライブラリ。

## 概要

このライブラリは、Slack通知、Googleカレンダー連携、GitHub連携などの自動化レシピをYAML形式で定義・管理するためのツールです。レシピの完全なCRUD操作、検証、REST API経由でのアクセスを提供します。

**Phase 2達成**: 完全なCRUD API、テスト、Docker環境、Seed機能を実装済み

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Framework**: Express 4.x (REST API)
- **Validation**: Zod 3.x
- **Testing**: Vitest 1.x
- **Container**: Docker & Docker Compose
- **Dev Tools**: tsx, ESLint

## Domain Model

### エンティティ: Recipe（レシピ）

レシピは自動化ワークフローの設計図です。

**主要フィールド**:
- `id` (string): 一意識別子
- `name` (string): レシピ名
- `description` (string): 説明
- `version` (string): バージョン
- `triggers` (array): 実行トリガー（manual, schedule, webhook）
- `actions` (array): 実行アクション（service + operation + params）
- `paramsSchema` (object): パラメータスキーマ定義
- `metadata` (object): メタデータ（author, tags, timestamps）

**関係性**:
- 1つのレシピは複数のトリガーを持つことができる
- 1つのレシピは複数のアクションを持つことができる
- アクションは順次実行される

## ディレクトリ構成

```
automation-recipes-library/
├── recipes/                    # レシピYAMLファイル（永続化層）
│   ├── slack-notify-001.yml
│   ├── gcal-create-event-001.yml
│   └── ...
├── src/
│   ├── models/                 # ドメインモデル
│   │   └── recipe.ts          # Recipe型定義・バリデーション
│   ├── loader/                 # データアクセス層
│   │   └── recipeLoader.ts    # YAML CRUD操作
│   ├── api/                    # プレゼンテーション層
│   │   ├── httpServer.ts      # REST APIサーバー
│   │   └── errorHandler.ts    # エラーハンドリング
│   ├── cli.ts                  # CLIツール
│   ├── __tests__/              # テスト
│   │   ├── recipe.test.ts
│   │   ├── recipeLoader.test.ts
│   │   └── errorHandler.test.ts
│   └── index.ts                # ライブラリエントリーポイント
├── scripts/
│   └── seed.ts                 # Seedスクリプト
├── Dockerfile
├── docker-compose.yml
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

## Getting Started

### Requirements

- Node.js 20.x以上
- npm または pnpm
- Docker & Docker Compose（オプション）

### Setup

**1. リポジトリのクローン**

```bash
git clone https://github.com/yourusername/automation-recipes-library.git
cd automation-recipes-library
```

**2. 環境変数の設定**

```bash
cp .env.example .env
# 必要に応じて.envを編集
```

**3. 依存関係のインストール**

```bash
npm install
```

**4. TypeScriptビルド**

```bash
npm run build
```

**5. Seedデータの投入（オプション）**

```bash
npm run recipes:seed
```

### 開発モード

```bash
# API開発サーバー起動（ホットリロード）
npm run dev

# または、TypeScriptビルドをウォッチ
npm run dev:build
```

### Docker環境での起動

```bash
# アプリをDockerで起動
docker compose up

# バックグラウンドで起動
docker compose up -d

# ログ確認
docker compose logs -f app

# 停止
docker compose down
```

## 使い方

### 1. REST API

**サーバー起動**

```bash
npm start
# サーバーは http://localhost:3000 で起動
```

**エンドポイント**

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/health` | ヘルスチェック |
| GET | `/api/recipes` | レシピ一覧取得 |
| GET | `/api/recipes?tag=slack` | タグでフィルタ |
| POST | `/api/recipes` | レシピ作成 |
| GET | `/api/recipes/:id` | レシピ詳細取得 |
| PUT | `/api/recipes/:id` | レシピ更新 |
| DELETE | `/api/recipes/:id` | レシピ削除 |
| GET | `/api/recipes/:id/metadata` | メタデータ取得 |

**レスポンス形式**

成功時:
```json
{
  "success": true,
  "data": { ... }
}
```

エラー時:
```json
{
  "success": false,
  "error": {
    "message": "エラーメッセージ",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

**APIの使用例**

```bash
# 一覧取得
curl http://localhost:3000/api/recipes

# レシピ作成
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d @new-recipe.json

# 詳細取得
curl http://localhost:3000/api/recipes/slack-notify-001

# 更新
curl -X PUT http://localhost:3000/api/recipes/slack-notify-001 \
  -H "Content-Type: application/json" \
  -d @updated-recipe.json

# 削除
curl -X DELETE http://localhost:3000/api/recipes/slack-notify-001
```

### 2. CLI

```bash
# レシピ検証
npm run validate
# または
npx recipes validate

# レシピ一覧表示
npm run recipes:list
# または
npx recipes list

# 特定レシピ表示
npx recipes show slack-notify-001

# Seedデータ投入
npm run recipes:seed

# ヘルプ
npx recipes help
```

### 3. ライブラリとして使用

```typescript
import {
  loadRecipesFromDirectory,
  findRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from 'automation-recipes-library';

// レシピを読み込む
const recipes = await loadRecipesFromDirectory('./recipes');

// IDで検索
const recipe = await findRecipeById('./recipes', 'slack-notify-001');

// 新規作成
await createRecipe('./recipes', newRecipe);

// 更新
await updateRecipe('./recipes', 'slack-notify-001', updatedRecipe);

// 削除
await deleteRecipe('./recipes', 'slack-notify-001');
```

## レシピフォーマット

レシピはYAML形式で定義します:

```yaml
id: unique-recipe-id
name: レシピの名前
description: レシピの説明
version: 1.0.0

triggers:
  - type: manual | schedule | webhook
    config:
      # トリガー固有の設定

actions:
  - id: action-1
    service: slack | gcal | github
    operation: send_message | create_event
    params:
      # アクション固有のパラメータ

paramsSchema:
  paramName:
    type: string | number | boolean | object | array
    description: パラメータの説明
    required: true | false
    default: デフォルト値

metadata:
  author: 作成者
  tags:
    - タグ1
    - タグ2
  createdAt: 作成日時
  updatedAt: 更新日時
```

## Example Flow: 垂直スライス実装

### デモシナリオ: GitHubIssue → Slack通知

このライブラリには完全に動作するエンドツーエンドフローが実装されています。

**1. Seedデータ投入**

```bash
npm run recipes:seed
```

これにより、以下のような実用的なレシピが作成されます:
- `github-issue-to-slack`: GitHub Issue作成時のSlack通知
- `daily-standup-reminder`: 毎日のスタンドアップリマインダー
- `meeting-scheduler`: ミーティング自動スケジューラー
- `pr-review-reminder`: PRレビューリマインダー
- `error-alert-aggregator`: エラーアラート集約

**2. APIサーバー起動**

```bash
npm run dev
```

**3. レシピの取得**

```bash
# 全レシピ取得
curl http://localhost:3000/api/recipes

# GitHubタグでフィルタ
curl http://localhost:3000/api/recipes?tag=github

# 特定レシピ取得
curl http://localhost:3000/api/recipes/github-issue-to-slack
```

**4. 新しいレシピを作成**

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-custom-recipe",
    "name": "My Custom Recipe",
    "description": "Custom automation",
    "triggers": [{"type": "manual"}],
    "actions": [{"id": "action-1", "service": "slack", "operation": "send_message"}]
  }'
```

**5. レシピを更新**

```bash
curl -X PUT http://localhost:3000/api/recipes/my-custom-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-custom-recipe",
    "name": "My Updated Recipe",
    "description": "Updated description",
    "triggers": [{"type": "manual"}],
    "actions": [{"id": "action-1", "service": "slack", "operation": "send_message"}]
  }'
```

**6. レシピを削除**

```bash
curl -X DELETE http://localhost:3000/api/recipes/my-custom-recipe
```

## テスト

```bash
# テスト実行
npm test

# テスト実行（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:run -- --coverage

# 型チェック
npm run typecheck
```

**テスト構成**:
- `recipe.test.ts`: レシピモデルのバリデーションテスト
- `recipeLoader.test.ts`: CRUD操作のテスト
- `errorHandler.test.ts`: エラーハンドリングのテスト

## 開発

```bash
# 開発サーバー（ホットリロード）
npm run dev

# TypeScriptビルド（ウォッチ）
npm run dev:build

# リント
npm run lint

# リント修正
npm run lint:fix

# クリーンビルド
npm run clean && npm run build
```

## 将来の展望

このライブラリは**レシピ管理と検証**に特化しており、現状では実際の実行機能は含まれていません。

### 実行エンジンとの連携想定

将来的に、別の実行エンジン（Execution Engine）がこのライブラリを利用する想定です：

```typescript
// 実行エンジン側の実装例
import { loadRecipesFromDirectory } from 'automation-recipes-library';
import { RecipeExecutor } from 'recipe-executor'; // 別パッケージ

const recipes = await loadRecipesFromDirectory('./recipes');
const executor = new RecipeExecutor();

for (const recipe of recipes) {
  // トリガー条件に応じてレシピを実行
  await executor.execute(recipe, {
    channel: '#general',
    message: 'Hello from automation!'
  });
}
```

### 今後の拡張予定

- [ ] 実行エンジンの実装（別リポジトリ）
- [ ] トリガーの実装（スケジュール、Webhook等）
- [ ] サービス連携の実装（Slack SDK、Google Calendar API等）
- [ ] PostgreSQLサポート（スケーラビリティ向上）
- [ ] レシピのバージョン管理
- [ ] レシピのテスト機能
- [ ] Web UIによるレシピ管理
- [ ] レシピのインポート/エクスポート
- [ ] レシピテンプレート

## License

MIT
