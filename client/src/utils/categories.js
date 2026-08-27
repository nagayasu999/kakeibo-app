/**
 * カテゴリ定義と表示色。
 * サーバー側 server/categories.js と同じ並び順を保つこと。
 *
 * 色はライト／ダーク双方で
 *   ・明度帯 ・彩度下限 ・色覚多様性での隣接分離 ・通常視での分離 ・背景とのコントラスト
 * を検証済みのカテゴリカルパレット（8スロット固定）。
 * スロットは固定割り当てで、系列数が変わっても色は使い回さない。
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

/** ライトモード用のカテゴリ色 */
const LIGHT_COLORS = {
  食費: '#2a78d6',
  外食: '#eb6834',
  日用品: '#1baf7a',
  '医療・薬': '#eda100',
  衣類: '#e87ba4',
  交通費: '#008300',
  娯楽: '#4a3aa7',
  その他: '#e34948',
};

/** ダークモード用のカテゴリ色（同じ8色をダーク背景向けに調整したもの） */
const DARK_COLORS = {
  食費: '#3987e5',
  外食: '#d95926',
  日用品: '#199e70',
  '医療・薬': '#c98500',
  衣類: '#d55181',
  交通費: '#008300',
  娯楽: '#9085e9',
  その他: '#e66767',
};

/**
 * カテゴリに対応する色を返す。
 * @param {string} category カテゴリ名
 * @param {'light'|'dark'} theme 現在のテーマ
 */
export function getCategoryColor(category, theme) {
  const table = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  return table[category] ?? table['その他'];
}
