/**
 * localStorage への保存・読み込み。
 * ページをリロードしてもデータが消えないようにする。
 */
const STORAGE_KEY = 'kakeibo-app:receipts:v1';

/**
 * 保存済みのレシート一覧を読み込む。
 * 壊れたデータが入っていてもアプリが落ちないように防御的に処理する。
 * @returns {Array} レシートの配列
 */
export function loadReceipts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((receipt) => receipt && Array.isArray(receipt.items));
  } catch (error) {
    console.warn('保存データの読み込みに失敗しました:', error);
    return [];
  }
}

/**
 * レシート一覧を保存する。
 * @param {Array} receipts 保存するレシートの配列
 */
export function saveReceipts(receipts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (error) {
    // 容量超過（QuotaExceededError）などはユーザーに伝える
    console.error('保存に失敗しました:', error);
    alert('データの保存に失敗しました。ブラウザの空き容量を確認してください。');
  }
}
