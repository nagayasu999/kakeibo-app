import { getCategoryColor } from '../utils/categories.js';
import { formatYen } from '../utils/format.js';

/**
 * カテゴリ別集計の表。
 * 円グラフの「表ビュー」を兼ねており、色が読み取れなくても
 * カテゴリと金額が必ず文字で確認できるようにしている。
 *
 * @param {{ data: Array<{category, amount, count}>, theme: 'light'|'dark' }} props
 */
export default function CategorySummaryTable({ data, theme }) {
  const total = data.reduce((sum, row) => sum + row.amount, 0);

  if (data.length === 0) {
    return <p className="empty">対象期間のデータがありません。</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th className="num">件数</th>
            <th className="num">金額</th>
            <th className="num">割合</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.category}>
              <td>
                <span
                  className="swatch"
                  style={{ background: getCategoryColor(row.category, theme) }}
                  aria-hidden="true"
                />
                {row.category}
              </td>
              <td className="num">{row.count}</td>
              <td className="num">{formatYen(row.amount)}</td>
              <td className="num">
                {total > 0 ? `${Math.round((row.amount / total) * 100)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>合計</td>
            <td className="num">{data.reduce((sum, row) => sum + row.count, 0)}</td>
            <td className="num">{formatYen(total)}</td>
            <td className="num">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
