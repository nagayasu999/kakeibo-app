/**
 * 家計簿で使用するカテゴリ定義。
 * Claude に渡す enum とアプリ側の表示・集計で共通利用する。
 * 色の識別性を担保するため、カテゴリは8つに固定している。
 */
export const CATEGORIES = [
  '食費',
  '外食',
  '日用品',
  '医療・薬',
  '衣類',
  '交通費',
  '娯楽',
  'その他',
];

/** 未知のカテゴリが返ってきた場合のフォールバック */
export const FALLBACK_CATEGORY = 'その他';

/**
 * Claude が返したカテゴリ名を正規の値に丸める。
 * @param {unknown} value Claude から返ってきたカテゴリ名
 * @returns {string} CATEGORIES のいずれか
 */
export function normalizeCategory(value) {
  if (typeof value !== 'string') return FALLBACK_CATEGORY;
  const trimmed = value.trim();
  return CATEGORIES.includes(trimmed) ? trimmed : FALLBACK_CATEGORY;
}
