/** 金額を「¥1,234」形式に整形する */
export function formatYen(value) {
  const number = Number.isFinite(value) ? Math.round(value) : 0;
  return `¥${number.toLocaleString('ja-JP')}`;
}

/** YYYY-MM-DD を「2026/08/27」形式に整形する */
export function formatDate(isoDate) {
  if (typeof isoDate !== 'string') return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${y}/${m}/${d}`;
}

/** YYYY-MM を「2026年8月」形式に整形する */
export function formatMonth(yearMonth) {
  const [y, m] = String(yearMonth).split('-');
  if (!y || !m) return yearMonth;
  return `${y}年${Number(m)}月`;
}

/** YYYY-MM-DD から YYYY-MM を取り出す */
export function toYearMonth(isoDate) {
  return String(isoDate).slice(0, 7);
}

/** 今日の日付を YYYY-MM-DD で返す */
export function today() {
  return new Date().toISOString().slice(0, 10);
}
