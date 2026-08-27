import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { readToken } from '../utils/theme.js';
import { formatYen, formatMonth } from '../utils/format.js';

// 棒グラフに必要な部品だけを登録する（系列が1つなので凡例は使わない）
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

/**
 * 棒の上に金額を直接描画するプラグイン。
 * 値ラベルはテキストトークンの色で描き、系列色は使わない。
 */
const valueLabelPlugin = {
  id: 'valueLabel',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.fillStyle = readToken('--text-secondary');
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    meta.data.forEach((bar, index) => {
      const value = chart.data.datasets[0].data[index];
      if (!value) return;
      ctx.fillText(`¥${Number(value).toLocaleString('ja-JP')}`, bar.x, bar.y - 6);
    });
    ctx.restore();
  },
};

/**
 * 月別支出の棒グラフ。棒をクリックするとその月を選択できる。
 * @param {{
 *   data: Array<{month: string, amount: number}>,
 *   theme: 'light'|'dark',
 *   selectedMonth: string,
 *   onSelectMonth: (month: string) => void
 * }} props
 */
export default function MonthlyBarChart({ data, theme, selectedMonth, onSelectMonth }) {
  const chartData = useMemo(() => {
    const accent = readToken('--accent');
    return {
      labels: data.map((row) => formatMonth(row.month)),
      datasets: [
        {
          label: '支出',
          data: data.map((row) => row.amount),
          backgroundColor: data.map((row) =>
            // 選択中の月だけを不透明にし、色相ではなく濃さで選択状態を示す
            !selectedMonth || row.month === selectedMonth ? accent : withAlpha(accent, 0.35),
          ),
          borderRadius: 4,
          borderSkipped: 'bottom',
          barPercentage: 0.62,
          categoryPercentage: 0.85,
          maxBarThickness: 46,
        },
      ],
    };
  }, [data, theme, selectedMonth]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      // 値ラベルのぶん上部に余白を確保する
      layout: { padding: { top: 18 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` 支出 ${formatYen(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          // 縦の目盛り線は引かず、基準線だけ残す
          grid: { display: false },
          border: { color: readToken('--axis') },
          ticks: { color: readToken('--text-muted'), font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: readToken('--grid'), drawTicks: false },
          border: { display: false },
          ticks: {
            color: readToken('--text-muted'),
            font: { size: 11 },
            padding: 8,
            callback: (value) => `¥${Number(value).toLocaleString('ja-JP')}`,
          },
        },
      },
      onClick: (event, elements) => {
        if (elements.length === 0) return;
        const month = data[elements[0].index]?.month;
        if (month) onSelectMonth(month === selectedMonth ? '' : month);
      },
    }),
    [data, theme, selectedMonth, onSelectMonth],
  );

  if (data.length === 0) {
    return <p className="empty">まだデータがありません。</p>;
  }

  return (
    <div className="chart-box">
      <Bar data={chartData} options={options} plugins={[valueLabelPlugin]} />
    </div>
  );
}

/** #rrggbb 形式の色に不透明度を付ける */
function withAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
