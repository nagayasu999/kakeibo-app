import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, normalizeCategory } from './categories.js';

/** 使用するモデル（Claude Haiku の最新バージョン） */
export const MODEL_ID = 'claude-haiku-4-5';

// APIキーは .env から読み込む。ブラウザ側には決して渡さない。
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * レシート情報を構造化して受け取るためのツール定義。
 * tool_choice で強制的に呼ばせることで、必ず JSON 形式の結果が得られる。
 */
const RECEIPT_TOOL = {
  name: 'record_receipt',
  description: 'レシート画像から読み取った購入情報を構造化して記録する。',
  input_schema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description:
          '購入日を YYYY-MM-DD 形式で。レシートから読み取れない場合は空文字列 "" を返す。',
      },
      store: {
        type: 'string',
        description: '店舗名。読み取れない場合は空文字列 "" を返す。',
      },
      items: {
        type: 'array',
        description:
          'レシートに記載された商品の一覧。小計・合計・お預り・お釣り・ポイントなどの行は含めない。',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '商品名' },
            price: {
              type: 'number',
              description: '税込価格（円）。数量がある場合は合計金額。',
            },
            category: {
              type: 'string',
              enum: CATEGORIES,
              description: '商品の内容から判断した家計簿カテゴリ',
            },
          },
          required: ['name', 'price', 'category'],
        },
      },
      total: {
        type: 'number',
        description: 'レシートの合計金額（円）。読み取れない場合は 0。',
      },
    },
    required: ['date', 'store', 'items', 'total'],
  },
};

/** Claude に渡すシステムプロンプト */
const SYSTEM_PROMPT = `あなたは日本のレシートを読み取る家計簿アシスタントです。
画像から以下を正確に抽出し、必ず record_receipt ツールを使って報告してください。

読み取りルール:
- 商品名は表示されているとおりに書き写す（略称もそのまま）。
- 価格は税込の実売価格（値引き後）を数値のみで返す。「¥」「,」「*」「軽」などの記号は含めない。
- 値引き・割引行は直前の商品の価格に反映させ、独立した商品としては扱わない。
- 小計 / 合計 / お預り / お釣り / ポイント / クレジット払いなどの行は items に含めない。
- 日付は和暦・「2025年8月3日」「25/08/03」などの表記も YYYY-MM-DD に変換する。
- 判読できない文字は推測せず、読み取れた範囲だけを返す。

カテゴリ分類の基準:
- 食費: スーパー等で購入した食材・飲料・調味料・パン・惣菜など
- 外食: レストラン・カフェ・ファストフード・居酒屋など店内飲食やテイクアウトの飲食代
- 日用品: 洗剤・ティッシュ・トイレットペーパー・掃除用品・台所用品など
- 医療・薬: 医薬品・処方箋・マスク・救急用品など
- 衣類: 服・下着・靴・アクセサリーなど
- 交通費: 電車・バス・タクシー・ガソリン・駐車場など
- 娯楽: 書籍・ゲーム・映画・趣味用品など
- その他: 光熱費・通信費を含め、上記のいずれにも当てはまらないもの`;

/**
 * レシート画像を Claude に渡して内容を解析する。
 * @param {string} base64Image base64エンコードされた画像データ（データURLのヘッダーは含まない）
 * @param {string} mediaType 画像のMIMEタイプ（image/jpeg など）
 * @returns {Promise<{date: string, store: string, items: Array, total: number}>}
 */
export async function analyzeReceipt(base64Image, mediaType) {
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [RECEIPT_TOOL],
    // 必ずツールを呼ばせることで、自由文ではなく構造化データを受け取る
    tool_choice: { type: 'tool', name: 'record_receipt' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: 'このレシートを読み取り、record_receipt ツールで結果を報告してください。',
          },
        ],
      },
    ],
  });

  // レスポンスから tool_use ブロックを取り出す
  const toolUse = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'record_receipt',
  );
  if (!toolUse) {
    throw new Error('レシートの解析結果を取得できませんでした。');
  }

  return normalizeReceipt(toolUse.input);
}

/**
 * Claude の出力を、アプリで扱いやすい形に整える。
 * 型崩れや欠損があっても落ちないように防御的に処理する。
 * @param {any} raw ツール呼び出しの入力値
 */
function normalizeReceipt(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];

  const normalizedItems = items
    .map((item) => ({
      name: String(item?.name ?? '').trim() || '（商品名不明）',
      price: toNumber(item?.price),
      category: normalizeCategory(item?.category),
    }))
    // 金額が取れなかった行は集計をゆがめるため除外する
    .filter((item) => Number.isFinite(item.price) && item.price > 0);

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.price, 0);
  const total = toNumber(raw?.total);

  return {
    date: normalizeDate(raw?.date),
    store: String(raw?.store ?? '').trim(),
    items: normalizedItems,
    // 合計が読み取れなかった場合は明細の合計で代用する
    total: total > 0 ? total : itemsTotal,
  };
}

/** 文字列や null を数値に変換する（変換できなければ 0） */
function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

/**
 * 日付を YYYY-MM-DD に正規化する。
 * 読み取れなかった場合は今日の日付を使う。
 */
function normalizeDate(value) {
  if (typeof value === 'string') {
    const matched = value.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
    if (matched) {
      const [, y, m, d] = matched;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}
