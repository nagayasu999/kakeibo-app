import { getCategoryColor } from '../utils/categories.js';
import { formatYen, formatDate } from '../utils/format.js';

/**
 * 登録済みの明細一覧。
 * @param {{
 *   rows: Array<{receiptId, date, store, name, price, category}>,
 *   theme: 'light'|'dark',
 *   onDeleteReceipt: (receiptId: string) => void
 * }} props
 */
export default function ExpenseTable({ rows, theme, onDeleteReceipt }) {
  if (rows.length === 0) {
    return <p className="empty">対象期間の明細がありません。</p>;
  }

  const total = rows.reduce((sum, row) => sum + row.price, 0);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>店舗</th>
            <th>商品名</th>
            <th>カテゴリ</th>
            <th className="num">金額</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{formatDate(row.date)}</td>
              <td>{row.store || '—'}</td>
              <td>{row.name}</td>
              <td>
                <span
                  className="swatch"
                  style={{ background: getCategoryColor(row.category, theme) }}
                  aria-hidden="true"
                />
                {row.category}
              </td>
              <td className="num">{formatYen(row.price)}</td>
              <td>
                {/* レシート単位で削除する（同じレシートの明細はまとめて消える） */}
                <button
                  type="button"
                  className="icon-button"
                  title="このレシートを削除"
                  onClick={() => onDeleteReceipt(row.receiptId)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>合計（{rows.length} 品目）</td>
            <td className="num">{formatYen(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
