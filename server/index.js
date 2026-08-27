import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// プロジェクトルートの .env を読み込む（server/ の1つ上の階層）
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env') });

// dotenv 実行後に import すると環境変数が読めるため、動的 import で読み込む
const { analyzeReceipt, MODEL_ID } = await import('./claudeClient.js');
const { CATEGORIES } = await import('./categories.js');

const app = express();
const PORT = process.env.PORT || 3001;

/** 受け付ける画像形式 */
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

app.use(cors());
// レシート画像を base64 で受け取るためリクエストサイズを拡張する
app.use(express.json({ limit: '15mb' }));

/** 稼働確認用。APIキーが設定されているかも返す。 */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    model: MODEL_ID,
    apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    categories: CATEGORIES,
  });
});

/**
 * レシート画像の解析エンドポイント。
 * body: { imageBase64: string, mediaType: string }
 */
app.post('/api/analyze-receipt', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error:
          'ANTHROPIC_API_KEY が設定されていません。プロジェクトルートの .env を確認してください。',
      });
    }

    const { imageBase64, mediaType } = req.body ?? {};

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return res.status(400).json({ error: '画像データが送信されていません。' });
    }
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      return res.status(400).json({
        error: `対応していない画像形式です（${mediaType}）。JPEG / PNG / GIF / WebP を指定してください。`,
      });
    }

    const receipt = await analyzeReceipt(imageBase64, mediaType);

    if (receipt.items.length === 0) {
      return res.status(422).json({
        error:
          'レシートから商品を読み取れませんでした。ピントや明るさを調整して撮り直してください。',
      });
    }

    return res.json(receipt);
  } catch (error) {
    console.error('[analyze-receipt] エラー:', error);

    // Claude API 由来のエラーはステータスコードごとにメッセージを出し分ける
    const status = error?.status;
    if (status === 401) {
      return res.status(500).json({ error: 'APIキーが無効です。.env の値を確認してください。' });
    }
    if (status === 429) {
      return res
        .status(429)
        .json({ error: 'リクエストが集中しています。少し待ってから再試行してください。' });
    }
    if (status === 413) {
      return res.status(413).json({ error: '画像サイズが大きすぎます。' });
    }

    return res
      .status(500)
      .json({ error: error?.message || 'レシートの解析中にエラーが発生しました。' });
  }
});

app.listen(PORT, () => {
  console.log(`家計簿APIサーバーを起動しました: http://localhost:${PORT}`);
  console.log(`使用モデル: ${MODEL_ID}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY が未設定です。.env.example をコピーして .env を作成してください。');
  }
});
