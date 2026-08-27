import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getCategoryColor } from '../utils/categories.js';
import { readToken } from '../utils/theme.js';
import { formatYen } from '../utils/format.js';

// 円グラフに必要な部品だけを登録する
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * カテゴリ別支出の円グラフ。
 * @param {{ data: Array<{category: string, amount: number}>, theme: 'light'|'dark' }} props
 */
export default function CategoryPieChart({ data, theme }) {
  const total = data.reduce((sum, row) => sum + row.amount, 0);

  const chartData = useMemo(() => {
    // トークン（CSS変数）から現在のテーマの色を読み、グラフ側と表示を揃える
    const surface = readToken('--surface');
    return {
      labels: data.map((row) => row.category),
      datasets: [
        {
          data: data.map((row) => row.amount),
          backgroundColor: data.map((row) => getCategoryColor(row.category, theme)),
          // 面と面の間に2pxの背景色スペーサーを入れて境界を明示する
          borderColor: surface,
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
    // theme が変わったら色を読み直す
  }, [data, theme]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      // 凡例テキストは系列色ではなくテキストトークンで表示する
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: readToken('--text-secondary'),
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 12,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              const share = total > 0 ? Math.round((value / total) * 100) : 0;
              return ` ${context.label}  ${formatYen(value)}（${share}%）`;
            },
          },
        },
      },
    }),
    [theme, total],
  );

  if (data.length === 0) {
    return <p className="empty">対象期間のデータがありません。</p>;
  }

  return (
    <div className="chart-box">
      <Pie data={chartData} options={options} />
    </div>
  );
}
