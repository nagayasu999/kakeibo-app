# レシート家計簿アプリ (kakeibo-app)

レシート画像をアップロードすると Claude API（`claude-haiku-4-5`）が内容を自動読み取りし、
カテゴリ別に分類・集計してグラフ表示する家計簿 Web アプリです。

## 構成

```
kakeibo-app/
├── server/          Node.js (Express) バックエンド。Claude API はここからのみ呼び出す
│   ├── index.js
│   └── claudeClient.js
├── client/          React (Vite) フロントエンド
│   └── src/
├── .env             APIキー（.gitignore 済み・自分で作成する）
└── .env.example     .env のひな形
```

- APIキーはサーバー側の `.env` でのみ管理し、ブラウザには一切渡しません。
- 登録データはブラウザの localStorage に保存されるため、リロードしても消えません。

## セットアップ

```bash
# 1. 依存パッケージをインストール（ルート・server・client 全部）
npm run setup

# 2. APIキーを設定
cp .env.example .env
#   .env を開いて ANTHROPIC_API_KEY=sk-ant-... を記入する

# 3. 起動（バックエンド:3001 / フロントエンド:5173 を同時起動）
npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

## 使い方

1. 「レシート画像を選択」からレシートの写真を選ぶ
2. 「読み取る」を押すと Claude が商品名・金額・日付・カテゴリを抽出
3. 内容を確認して「家計簿に登録」
4. 一覧・円グラフ（カテゴリ別）・棒グラフ（月別）が自動更新される

## 使用モデル

`claude-haiku-4-5` （Claude Haiku の最新バージョン）

## 主なスクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run setup` | 全ワークスペースの依存をインストール |
| `npm run dev` | サーバーとクライアントを同時起動 |
| `npm run dev:server` | バックエンドのみ起動 |
| `npm run dev:client` | フロントエンドのみ起動 |
| `npm run build` | フロントエンドを本番ビルド |
