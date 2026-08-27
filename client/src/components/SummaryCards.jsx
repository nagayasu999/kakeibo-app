import { formatYen } from '../utils/format.js';

/**
 * 画面上部の統計タイル。
 * @param {{ periodLabel: string, periodTotal: number, receiptCount: number, itemCount: number, allTimeTotal: number }} props
 */
export default function SummaryCards({
  periodLabel,
  periodTotal,
  receiptCount,
  itemCount,
  allTimeTotal,
}) {
  return (
    <div className="summary">
      <div className="stat-tile">
        <div className="label">{periodLabel}の支出</div>
        <div className="value">{formatYen(periodTotal)}</div>
        <div className="sub">{itemCount} 品目</div>
      </div>
      <div className="stat-tile">
        <div className="label">累計支出</div>
        <div className="value">{formatYen(allTimeTotal)}</div>
        <div className="sub">登録レシート {receiptCount} 枚</div>
      </div>
      <div className="stat-tile">
        <div className="label">レシート1枚あたり</div>
        <div className="value">
          {formatYen(receiptCount > 0 ? allTimeTotal / receiptCount : 0)}
        </div>
        <div className="sub">累計の平均</div>
      </div>
    </div>
  );
}
