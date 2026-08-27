/**
 * 登録前のレシート下書きに対する検証。
 *
 * ここでは「警告」だけを返し、登録を止めるかどうかは呼び出し側が決める。
 * レシートの読み取りは Claude の推定なので、誤検知でもユーザーが
 * 判断して登録できる余地を残しておくため。
 */

/**
 * 金額が負の明細を抽出する。
 * @param {Array} items 明細の配列
 * @returns {Array<{index: number, name: string, price: number}>} 負の明細（元の並び順）
 */
export function findNegativeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => ({
      index,
      name: typeof item?.name === 'string' ? item.name : '',
      price: Number(item?.price),
    }))
    .filter((item) => Number.isFinite(item.price) && item.price < 0);
}

/**
 * 実際に登録される明細（金額が正のもの）の合計金額。
 * 重複判定は「登録後に保存される合計」と比べる必要があるため、
 * 画面に出す下書き合計ではなくこちらを使う。
 * @param {Array} items 明細の配列
 * @returns {number} 合計金額
 */
export function sumRegisterable(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = Number(item?.price);
    return Number.isFinite(price) && price > 0 ? sum + price : sum;
  }, 0);
}

/**
 * 同じ日付・同じ合計金額のレシートを既存データから探す。
 * @param {string} date 下書きの購入日（YYYY-MM-DD）
 * @param {number} total 登録される合計金額
 * @param {Array} receipts 登録済みレシートの配列
 * @returns {Array} 一致した既存レシート
 */
export function findDuplicateReceipts(date, total, receipts) {
  if (!Array.isArray(receipts)) return [];
  if (!date || !Number.isFinite(total) || total <= 0) return [];
  return receipts.filter(
    (receipt) => receipt?.date === date && Number(receipt?.total) === total,
  );
}

/**
 * 下書き全体を検証して警告をまとめる。
 * @param {object|null} draft 解析結果の下書き
 * @param {Array} receipts 登録済みレシートの配列
 * @returns {{negativeItems: Array, duplicates: Array, registerTotal: number, hasWarning: boolean}}
 */
export function validateDraft(draft, receipts) {
  if (!draft) {
    return { negativeItems: [], duplicates: [], registerTotal: 0, hasWarning: false };
  }

  const negativeItems = findNegativeItems(draft.items);
  const registerTotal = sumRegisterable(draft.items);
  const duplicates = findDuplicateReceipts(draft.date, registerTotal, receipts);

  return {
    negativeItems,
    duplicates,
    registerTotal,
    hasWarning: negativeItems.length > 0 || duplicates.length > 0,
  };
}
