# automation-recipes-library

各サービス間の自動連携レシピをYAMLで管理し、実行エンジンから読み込めるようにするレシピライブラリ。

## 概要

このライブラリは、Slack通知、Googleカレンダー連携、GitHub連携などの自動化レシピをYAML形式で定義・管理するためのツールです。レシピの検証、読み込み、REST API経由でのアクセスを提供します。

## Tech Stack

- Node.js 20+
- TypeScript
- YAML
- Express (REST API)
- Zod (バリデーション)

## ディレクトリ構成

```
automation-recipes-library/
├── recipes/                    # レシピYAMLファイル置き場
│   ├── sample-slack-notify.yml
│   └── sample-gcal-create.yml
├── src/
│   ├── models/                 # データモデル定義
│   │   └── recipe.ts          # レシピの型定義とバリデーション
│   ├── loader/                 # レシピローダー
│   │   └── recipeLoader.ts    # YAML読み込み・検証ロジック
│   ├── api/                    # REST API
│   │   └── httpServer.ts      # Express APIサーバー
│   ├── cli.ts                  # CLIツール
│   └── index.ts                # ライブラリエントリーポイント
├── package.json
└── tsconfig.json
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScriptビルド
npm run build
```

## 使い方

### 1. CLIでレシピを検証

```bash
# recipesフォルダ内のYAMLファイルを検証
npm run validate

# または
npx recipes validate

# 特定のディレクトリを検証
npx recipes validate ./my-recipes
```

### 2. レシピ一覧を表示

```bash
npx recipes list
```

### 3. 特定のレシピを表示

```bash
npx recipes show slack-notify-001
```

### 4. REST API サーバーを起動

```bash
npm start
```

APIエンドポイント:
- `GET /health` - ヘルスチェック
- `GET /api/recipes` - レシピ一覧取得
- `GET /api/recipes?tag=slack` - タグでフィルタリング
- `GET /api/recipes/:id` - 特定のレシピ取得
- `GET /api/recipes/:id/metadata` - メタデータのみ取得

### 5. ライブラリとして使用

```typescript
import { loadRecipesFromDirectory, findRecipeById } from 'automation-recipes-library';

// レシピを読み込む
const recipes = await loadRecipesFromDirectory('./recipes');

// IDで検索
const recipe = await findRecipeById('./recipes', 'slack-notify-001');
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
- [ ] レシピのバージョン管理
- [ ] レシピのテスト機能
- [ ] Web UIによるレシピ管理

## 開発

```bash
# 開発モード（ウォッチモード）
npm run dev

# リント
npm run lint

# テスト
npm test
```

## License

MIT
